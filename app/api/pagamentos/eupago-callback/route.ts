import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { verificarAssinaturaWebhook } from "@/lib/eupago";
import { sendOrderConfirmation } from "@/lib/email";

// Recebe as notificações de pagamento do Eupago ("Realtime Webhooks 2.0",
// eupago.readme.io/reference/realtime-webhooks-20) e marca a encomenda
// correspondente como paga. Configurar este URL no backoffice do Eupago,
// no canal → secção "Webhooks 2.0" → "Webhook Endpoint".
//
// Corpo esperado: { transactions: { identifier, status, entity, reference,
// method, amount, fees, date, trid }, channel: { name } }. `status` pode
// ser "Paid" | "Refund" | "Error" | "Cancel" | "Expired".
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
  expired: "expirado",
  cancel: "cancelado",
  error: "cancelado",
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
    return new Response("OK", { status: 200 });
  }

  const [encomenda] = await db.select().from(orders).where(eq(orders.eupagoIdentificador, identificador));
  // "pago" nunca é sobreposto (idempotência); um estado terminal
  // (cancelado/expirado) só se aplica vindo de "pendente" — não faz sentido
  // sobrepor um "pago" ou "cancelado" já definidos com um "expirado" tardio.
  if (!encomenda || encomenda.status === "pago" || (novoEstado !== "pago" && encomenda.status !== "pendente")) {
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
  }

  return new Response("OK", { status: 200 });
}
