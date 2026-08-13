"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { sendOrderConfirmation, sendNotificacaoEncomendaPaga } from "@/lib/email";

async function exigirAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Não autorizado");
}

export async function apagarEncomendaAdmin(id: string) {
  await exigirAdmin();
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/admin/encomendas");
}

// Fallback manual para quando o webhook do Eupago falha em silêncio (ver
// app/api/pagamentos/eupago-callback/route.ts) — replica exatamente o que
// esse callback faz quando reconhece um pagamento: marca como pago e manda
// os mesmos emails (confirmação + recibo ao cliente, notificação interna),
// para o cliente ficar com o mesmo comprovativo que teria tido
// automaticamente. Por isso o aviso de confirmação no painel deixa isto
// explícito antes de agir.
export async function forcarPagoAdmin(id: string) {
  await exigirAdmin();

  const [encomenda] = await db.select().from(orders).where(eq(orders.id, id));
  if (!encomenda || encomenda.status === "pago") return;

  await db.update(orders).set({ status: "pago", paidAt: new Date() }).where(eq(orders.id, id));

  const itens = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  await sendOrderConfirmation(encomenda.email, {
    id: encomenda.id,
    nome: encomenda.nome,
    itens: itens.map((item) => ({ nome: item.nome, quantidade: item.quantidade, precoCentimos: item.precoCentimos })),
    totalCentimos: encomenda.totalCentimos,
  });

  await sendNotificacaoEncomendaPaga({
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

  revalidatePath("/admin/encomendas");
  revalidatePath("/perfil");
}

// Último estado do fluxo — sem API dos correios, é o admin que marca à mão
// quando a encomenda sai para entrega. Sem email associado (nada foi pedido
// para este passo).
export async function marcarEnviadoAdmin(id: string) {
  await exigirAdmin();
  await db.update(orders).set({ status: "enviado" }).where(eq(orders.id, id));
  revalidatePath("/admin/encomendas");
  revalidatePath("/perfil");
}
