import { eq, inArray } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/lib/db";
import { orders, orderItems, quotaPagamentos } from "@/lib/db/schema";
import { verificarAssinaturaWebhook } from "@/lib/eupago";
import { sendOrderConfirmation, sendNotificacaoEncomendaPaga, sendConfirmacaoQuotaPaga, sendNotificacaoQuotaPaga } from "@/lib/email";

// Recebe as notificações de pagamento do Eupago ("Realtime Webhooks 2.0",
// eupago.readme.io/reference/realtime-webhooks-20) e marca a encomenda
// correspondente como paga. Configurar este URL no backoffice do Eupago,
// no canal → secção "Webhooks 2.0" → "Webhook Endpoint".
//
// Corpo REAL (confirmado com um payload real capturado em produção a
// 2026-09-24, pagamento MB WAY de 1€): { transaction: { identifier, status,
// entity, reference, method, amount, fees, date, trid, local }, channel:
// { account, name } }. A doc pública do Eupago mostra a chave no plural
// ("transactions") — está errada/desatualizada; o payload real usa o
// singular ("transaction"). Isto (não o vocabulário do `status`, que já
// vinha corretamente como "Paid") foi a causa de todas as encomendas
// ficarem presas em "pendente" durante semanas: `payload.transactions`
// era sempre undefined, por isso caía sempre no ramo "não reconhecido"
// abaixo. Não repetir o erro da doc se este ficheiro for revisto outra vez.
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

  const transacao = (payload as { transaction?: Record<string, unknown> })?.transaction;
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
    // waitUntil obrigatório aqui, não opcional — sem isto, a Vercel pode
    // terminar a função assim que o Response abaixo é devolvido ao Eupago,
    // matando esta promise a meio (mesma causa raiz identificada no envio
    // de emails de registo, ver app/actions/auth.ts).
    waitUntil(
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
      }).catch(() => null)
    );
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
    // waitUntil obrigatório aqui — mesmo motivo do ramo de encomendas acima.
    waitUntil(
      sendNotificacaoQuotaPaga({
        nome: pagamento.nome,
        email: pagamento.email,
        valor: pagamento.valorCentimos / 100,
        metodoPagamento: pagamento.metodoPagamento,
      }).catch(() => null)
    );
  }

  return new Response("OK", { status: 200 });
}
