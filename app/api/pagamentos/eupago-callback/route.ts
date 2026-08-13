import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, quotaPagamentos } from "@/lib/db/schema";
import { verificarAssinaturaWebhook } from "@/lib/eupago";
import { sendOrderConfirmation, sendNotificacaoEncomendaPaga, sendConfirmacaoQuotaPaga, sendNotificacaoQuotaPaga } from "@/lib/email";

// Recebe as notificações de pagamento do Eupago ("Realtime Webhooks 2.0",
// eupago.readme.io/reference/realtime-webhooks-20) e marca a encomenda
// correspondente como paga. Configurar este URL no backoffice do Eupago,
// no canal → secção "Webhooks 2.0" → "Webhook Endpoint".
//
// Corpo esperado: { transactions: { identifier, status, entity, reference,
// method, amount, fees, date, trid }, channel: { name } }. `status` pode
// ser "Paid" | "Refund" | "Error" | "Cancel" | "Expired" (doc geral) — mas o
// MB WAY parece devolver o vocabulário da sua própria API de criação
// (`transactionStatus: "Success"`, ver lib/eupago.ts pedirPagamentoMbway) em
// vez de "Paid" no callback. Confirmado em produção 2026-08-12: um pagamento
// MB WAY real disparou este endpoint (200, assinatura válida) mas a
// encomenda ficou presa em "pendente" — o mapeamento abaixo não reconhecia
// o status recebido. "success"/"rejected" adicionados por precaução; não
// ainda confirmado o valor exato porque o payload não fica registado nos
// logs de acesso da Vercel (só depois deste console.error).
//
// AVISO: se o canal tiver "Encriptar Webhook" = "Sim", o corpo pode vir
// como { data: "<encriptado>" } em vez da estrutura acima — a doc pública
// não explica o esquema de desencriptação. Manter "Encriptar Webhook" =
// "Não" no backoffice enquanto este handler só ler o JSON em claro.
//
// Um pedido MB WAY/Multibanco que expira ou é cancelado também dispara este
// callback (não só "Paid") — sem isto a encomenda ficava presa em
// "pendente" para sempre, mesmo depois do código ter expirado no telemóvel.
const MAPA_ESTADO: Record<string, "pago" | "cancelado" | "expirado"> = {
  paid: "pago",
  success: "pago",
  expired: "expirado",
  cancel: "cancelado",
  cancelled: "cancelado",
  error: "cancelado",
  rejected: "cancelado",
};

export async function POST(request: Request) {
  const corpoBruto = await request.text();
  const assinatura = request.headers.get("x-signature");

  if (!verificarAssinaturaWebhook(corpoBruto, assinatura)) {
    return new Response("Assinatura inválida", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(corpoBruto);
  } catch {
    return new Response("OK", { status: 200 });
  }

  const transacao = (payload as { transactions?: Record<string, unknown> })?.transactions;
  const identificador = transacao?.identifier;
  const novoEstado = MAPA_ESTADO[String(transacao?.status ?? "").toLowerCase()];

  if (typeof identificador !== "string" || !novoEstado) {
    // Payload chegou e passou a assinatura, mas não bateu certo com o que
    // esperávamos — isto é exatamente o que aconteceu em silêncio 2026-08-12
    // com um pagamento MB WAY real. Log em vez de desaparecer sem rasto.
    console.error("eupago-callback: payload não reconhecido", JSON.stringify(payload));
    return new Response("OK", { status: 200 });
  }

  // Pagamentos de quota (ver app/actions/quota.ts) usam o identificador
  // "quota:{id}" em vez do id nu de uma encomenda, para o webhook conseguir
  // distinguir os dois sem ambiguidade — mesmo canal Eupago, tabela
  // diferente. O ramo de encomendas abaixo fica intocado.
  if (identificador.startsWith("quota:")) {
    return processarCallbackQuota(identificador.slice("quota:".length), novoEstado);
  }

  const [encomenda] = await db.select().from(orders).where(eq(orders.eupagoIdentificador, identificador));
  // Um estado já "final" para o pagamento (pago/enviado) nunca é sobreposto
  // por um webhook tardio ou duplicado; cancelado/expirado só se aplica
  // vindo de "pendente" — não faz sentido um "expirado" tardio sobrepor um
  // "pago" já confirmado.
  const jaConfirmado = encomenda?.status === "pago" || encomenda?.status === "enviado";
  if (!encomenda || jaConfirmado || (novoEstado !== "pago" && encomenda.status !== "pendente")) {
    if (!encomenda) console.error("eupago-callback: sem encomenda com este identificador", identificador);
    return new Response("OK", { status: 200 });
  }

  await db
    .update(orders)
    .set({ status: novoEstado, paidAt: novoEstado === "pago" ? new Date() : null })
    .where(eq(orders.id, encomenda.id));

  if (novoEstado === "pago") {
    const itens = await db.select().from(orderItems).where(inArray(orderItems.orderId, [encomenda.id]));
    await sendOrderConfirmation(encomenda.email, {
      id: encomenda.id,
      nome: encomenda.nome,
      itens: itens.map((item) => ({ nome: item.nome, quantidade: item.quantidade, precoCentimos: item.precoCentimos })),
      totalCentimos: encomenda.totalCentimos,
    });
    sendNotificacaoEncomendaPaga({
      id: encomenda.id,
      nome: encomenda.nome,
      email: encomenda.email,
      telefone: encomenda.telefone,
      totalCentimos: encomenda.totalCentimos,
      metodoPagamento: encomenda.metodoPagamento,
      metodoEntrega: encomenda.metodoEntrega,
      moradaLinha: encomenda.moradaLinha,
      codigoPostal: encomenda.codigoPostal,
      cidade: encomenda.cidade,
      itens: itens.map((item) => ({ nome: item.nome, quantidade: item.quantidade })),
    }).catch(() => null);
  }

  return new Response("OK", { status: 200 });
}

// Mesma lógica de idempotência do ramo de encomendas acima (nunca sobrepor
// um "pago" já confirmado; cancelado/expirado só a partir de "pendente") —
// ver comentário lá para o porquê. O registo como paga no Quotagest continua
// manual (ver app/actions/quota.ts) — aqui só se confirma o pagamento do
// nosso lado e se avisam os dois emails.
async function processarCallbackQuota(id: string, novoEstado: "pago" | "cancelado" | "expirado"): Promise<Response> {
  const [pagamento] = await db.select().from(quotaPagamentos).where(eq(quotaPagamentos.id, id));
  const jaConfirmado = pagamento?.status === "pago";
  if (!pagamento || jaConfirmado || (novoEstado !== "pago" && pagamento.status !== "pendente")) {
    if (!pagamento) console.error("eupago-callback: sem quota_pagamento com este id", id);
    return new Response("OK", { status: 200 });
  }

  await db
    .update(quotaPagamentos)
    .set({ status: novoEstado, paidAt: novoEstado === "pago" ? new Date() : null })
    .where(eq(quotaPagamentos.id, pagamento.id));

  if (novoEstado === "pago") {
    const dataPagamento = new Date();
    await sendConfirmacaoQuotaPaga(pagamento.email, {
      nome: pagamento.nome,
      valor: pagamento.valorCentimos / 100,
      dataPagamento,
    });
    sendNotificacaoQuotaPaga({
      nome: pagamento.nome,
      email: pagamento.email,
      valor: pagamento.valorCentimos / 100,
      metodoPagamento: pagamento.metodoPagamento,
    }).catch(() => null);
  }

  return new Response("OK", { status: 200 });
}
