import { createHmac, timingSafeEqual } from "crypto";

// Integração com a API REST do Eupago (eupago.readme.io). Autenticação é
// uma única "Chave API" por canal (formato xxxx-xxxx-xxxx-xxxx-xxxx,
// visível no backoffice em Channels → Channel Listing) — não o
// client_id/client_secret/entidade/subentidade que um esqueleto anterior
// deste ficheiro assumia (essa forma é da SOAP API antiga, incompatível
// com estes endpoints).
//
// Canal próprio e dedicado à Loja — NÃO é o mesmo canal que o Quotagest usa
// para as quotas dos sócios (confirmado 2026-08-12: entidade Multibanco da
// Loja é 21921, a do Quotagest é 12232 — entidades diferentes = canais
// diferentes). Um comentário anterior aqui dizia o contrário; estava errado.
// Consequência: o Webhook 2.0 configurado no canal da Loja só recebe
// notificações de pagamentos da Loja, nunca de quotas — o que quer que o
// Quotagest use para se auto-atualizar (se é que usa) é inteiramente
// separado disto e não temos visibilidade sobre isso.
//
// Multibanco usa a chave no corpo do pedido (API REST "legada"); MB WAY e
// Cartão usam-na num header Authorization (API v1.02). Ver cada função.

const SANDBOX = process.env.EUPAGO_SANDBOX === "true";
const HOST = SANDBOX ? "sandbox.eupago.pt" : "clientes.eupago.pt";

function lerChave(): string {
  const chave = process.env.EUPAGO_API_KEY;
  if (!chave) {
    throw new Error("Pagamentos ainda não estão configurados (falta EUPAGO_API_KEY no ambiente). Ver lib/eupago.ts.");
  }
  return chave;
}

export interface PedidoPagamento {
  identificador: string; // referência interna nossa (id da encomenda) — usada para ligar o callback à encomenda
  valor: number; // euros
  descricao: string;
}

export interface ReferenciaMultibanco {
  entidade: string;
  referencia: string;
  valor: number;
  /** formato "YYYY-MM-DD" — até ao fim deste dia a referência aceita pagamento */
  dataFim: string;
}

export interface PedidoMbway {
  referencia: string;
  transactionID: string;
}

// data_fim só aceita uma data (AAAA-MM-DD), não hora exata — por isso "2
// dias" na prática é "válida até ao fim do 2º dia seguinte", nunca 48h
// exatas a partir do momento da compra (decisão do utilizador, 2026-08-11,
// já avisado desta imprecisão).
const VALIDADE_MULTIBANCO_DIAS = 2;

function dataFimMultibanco(): string {
  const data = new Date();
  data.setDate(data.getDate() + VALIDADE_MULTIBANCO_DIAS);
  return data.toISOString().slice(0, 10);
}

export async function gerarReferenciaMultibanco(pedido: PedidoPagamento): Promise<ReferenciaMultibanco> {
  const chave = lerChave();
  const dataFim = dataFimMultibanco();
  const res = await fetch(`https://${HOST}/clientes/rest_api/multibanco/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chave,
      valor: pedido.valor.toFixed(2),
      id: pedido.identificador,
      per_dup: 0, // só permite 1 pagamento por referência
      data_fim: dataFim,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.sucesso !== true) {
    throw new Error(`gerarReferenciaMultibanco: Eupago recusou o pedido (${json?.resposta ?? res.status}).`);
  }
  // A Eupago costuma ecoar o data_fim pedido de volta — usa isso se vier,
  // senão confia no valor que já enviámos no pedido.
  return { entidade: json.entidade, referencia: json.referencia, valor: pedido.valor, dataFim: json.data_fim || dataFim };
}

export async function pedirPagamentoMbway(pedido: PedidoPagamento & { telemovel: string }): Promise<PedidoMbway> {
  const chave = lerChave();
  const res = await fetch(`https://${HOST}/api/v1.02/mbway/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `ApiKey ${chave}` },
    body: JSON.stringify({
      payment: {
        identifier: pedido.identificador,
        customerPhone: pedido.telemovel,
        countryCode: "+351",
        amount: { value: pedido.valor, currency: "EUR" },
      },
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.transactionStatus !== "Success") {
    throw new Error(`pedirPagamentoMbway: Eupago recusou o pedido (${json?.text ?? res.status}).`);
  }
  return { referencia: json.reference, transactionID: json.transactionID };
}

export async function gerarLinkPagamentoCartao(
  pedido: PedidoPagamento & { email: string; successUrl: string; failUrl: string; backUrl: string }
): Promise<{ url: string }> {
  const chave = lerChave();
  const res = await fetch(`https://${HOST}/api/v1.02/creditcard/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `ApiKey ${chave}` },
    body: JSON.stringify({
      payment: {
        identifier: pedido.identificador,
        amount: { value: pedido.valor, currency: "EUR" },
        successUrl: pedido.successUrl,
        failUrl: pedido.failUrl,
        backUrl: pedido.backUrl,
        lang: "PT",
      },
      customer: { email: pedido.email, notify: true },
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.transactionStatus !== "Success" || !json?.redirectUrl) {
    throw new Error(`gerarLinkPagamentoCartao: Eupago recusou o pedido (${json?.text ?? res.status}).`);
  }
  return { url: json.redirectUrl };
}

// Confirma que um pedido recebido em app/api/pagamentos/eupago-callback veio
// mesmo do Eupago (header X-Signature, HMAC-SHA256 em base64 sobre o corpo
// bruto do pedido) — sem isto, qualquer pessoa podia chamar o callback a
// mandar marcar encomendas como pagas. Falha fechado (rejeita) se
// EUPAGO_WEBHOOK_SECRET não estiver definida — nunca reutiliza EUPAGO_API_KEY
// (chave com outro propósito, autenticar pedidos de saída à Eupago) como
// fallback. Por testar com uma transação real antes de confiar cegamente
// nisto em produção.
export function verificarAssinaturaWebhook(corpoBruto: string, assinaturaBase64: string | null): boolean {
  if (!assinaturaBase64) return false;
  const chave = process.env.EUPAGO_WEBHOOK_SECRET;
  if (!chave) return false;

  const esperada = createHmac("sha256", chave).update(corpoBruto).digest();
  let recebida: Buffer;
  try {
    recebida = Buffer.from(assinaturaBase64, "base64");
  } catch {
    return false;
  }
  if (recebida.length !== esperada.length) return false;
  return timingSafeEqual(esperada, recebida);
}
