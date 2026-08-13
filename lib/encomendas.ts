import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

// Portes fixos por encomenda — valor simbólico a confirmar com o sr.
// Joaquim (itens individuais cabem em envelope pequeno; encomendas grandes
// tipo várias dezenas de gorros ficam fora do fluxo automático do site).
// Isolado aqui para ser fácil de trocar sem mexer no resto do código.
export const PORTES_EUROS = 1.5;

// MB WAY expira ao fim de 5 min (ver lib/eupago.ts pedirPagamentoMbway), mas
// confirmado com um teste real 2026-08-13 que o Eupago NÃO avisa o nosso
// webhook quando isso acontece — a encomenda ficava presa em "pendente"
// para sempre. Sem cron (Vercel só permite cron frequente no plano Pro, e
// pg_cron do Neon não é fiável aqui porque a BD hiberna quando está
// inativa), por isso "curamo-nos sozinhos": chamado sempre que alguém visita
// uma página que lista encomendas (perfil ou painel de admin), antes de
// devolver os dados. Margem de 7 min (não 5) para dar folga ao relógio do
// Eupago vs o nosso.
const MBWAY_EXPIRA_APOS_MINUTOS = 7;

export async function expirarMbwayPendentes(): Promise<void> {
  const limite = new Date(Date.now() - MBWAY_EXPIRA_APOS_MINUTOS * 60 * 1000);
  await db
    .update(orders)
    .set({ status: "expirado" })
    .where(and(eq(orders.status, "pendente"), eq(orders.metodoPagamento, "mbway"), lt(orders.createdAt, limite)));
}
