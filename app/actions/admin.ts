"use server";

import { revalidatePath } from "next/cache";
import { eq, ne, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { sendOrderConfirmation, sendNotificacaoEncomendaPaga, sendEncomendaEnviada } from "@/lib/email";
import { atualizarSocio, type AtualizarSocioInput } from "@/lib/quotagest";
import { exigirAdmin } from "@/lib/admin-auth";

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
// quando a encomenda sai para entrega. codigoRastreio é opcional (nem todo
// envio tem um) e só se aplica a "envio" — para levantamento em mão não faz
// sentido. Manda ao cliente sendEncomendaEnviada (texto diferente consoante
// envio/levantamento, e menciona o rastreio só se tiver sido dado).
export async function marcarEnviadoAdmin(id: string, codigoRastreio?: string | null) {
  await exigirAdmin();

  const [encomenda] = await db.select().from(orders).where(eq(orders.id, id));
  if (!encomenda || encomenda.status !== "pago") return;

  const rastreio = encomenda.metodoEntrega === "envio" ? codigoRastreio?.trim() || null : null;

  await db.update(orders).set({ status: "enviado", codigoRastreio: rastreio }).where(eq(orders.id, id));

  await sendEncomendaEnviada(encomenda.email, {
    id: encomenda.id,
    metodoEntrega: encomenda.metodoEntrega,
    codigoRastreio: rastreio,
  }).catch(() => null);

  revalidatePath("/admin/encomendas");
  revalidatePath("/perfil");
}

// Único ponto de escrita para dados de sócio no painel — ver atualizarSocio
// em lib/quotagest.ts para o porquê do âmbito ficar limitado a estes
// campos. Erro devolvido em vez de lançado, para o painel mostrar uma
// mensagem em vez de rebentar (falar com uma API externa pode falhar por
// motivos fora do nosso controlo).
export async function atualizarSocioAdmin(id: string, dados: AtualizarSocioInput): Promise<{ error?: string }> {
  await exigirAdmin();
  try {
    await atualizarSocio(id, dados);
  } catch {
    return { error: "Não foi possível guardar no Quotagest. Tenta outra vez." };
  }
  revalidatePath("/admin/socios");
  return {};
}

export type AtualizarUtilizadorInput = {
  nome: string;
  email: string;
  telefone: string | null;
  morada: string | null;
  codigoPostal: string | null;
  cidade: string | null;
};

// Mexe na credencial de login (email) — diferente de atualizarSocio, que só
// toca em dados de contacto num sistema externo. Mesma verificação de email
// duplicado que pedirAlteracaoEmail (app/actions/perfil.ts) usa, mas sem o
// fluxo de confirmação por link: aqui é o admin a corrigir em nome de
// alguém (ex: erro de escrita no registo), depois de confirmar diretamente
// com a pessoa — não uma alteração pedida pelo próprio dentro da conta.
export async function atualizarUtilizadorAdmin(id: string, dados: AtualizarUtilizadorInput): Promise<{ error?: string }> {
  await exigirAdmin();

  const email = dados.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido." };

  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, id)))
    .limit(1);
  if (existente) return { error: "Já existe uma conta com este email." };

  await db
    .update(users)
    .set({
      name: dados.nome.trim(),
      email,
      phone: dados.telefone?.trim() || null,
      addressLine: dados.morada?.trim() || null,
      postalCode: dados.codigoPostal?.trim() || null,
      city: dados.cidade?.trim() || null,
    })
    .where(eq(users.id, id));

  revalidatePath("/admin/utilizadores");
  revalidatePath("/perfil");
  return {};
}

// Desfaz uma ligação conta↔sócio errada (ex: auto-match apanhou o sócio
// errado) — não apaga nada, só liberta o quotagestId para um novo
// auto-match/pesquisa manual poder ligar-se ao correto. Afeta também o
// badge "Tem conta" em /admin/socios, por isso revalida os dois.
export async function desvincularSocioAdmin(id: string): Promise<void> {
  await exigirAdmin();
  await db.update(users).set({ quotagestId: null }).where(eq(users.id, id));
  revalidatePath("/admin/utilizadores");
  revalidatePath("/admin/socios");
  revalidatePath("/perfil");
}
