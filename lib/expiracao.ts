import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, quotaPagamentos } from "@/lib/db/schema";

// Ficheiro à parte de lib/encomendas.ts de propósito — este importa lib/db
// (liga à BD com DATABASE_URL), e lib/encomendas.ts é importado por
// componentes client (CartSheet.tsx, CheckoutForm.tsx) para o PORTES_EUROS.
// Misturar os dois no mesmo ficheiro rebentava o bundle do cliente ("No
// database connection string was provided to neon()") porque o Next incluía
// o código de ligação à BD no JS que corre no browser. "server-only" aqui
// garante que um import destes por engano num client component falha já no
// build, em vez de só rebentar em runtime.
//
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

// Mesmo problema, mesma solução — ver comentário acima. Chamado a par de
// expirarMbwayPendentes() no topo de app/perfil/page.tsx: um MB WAY de
// quota pendente a mais de 7 min também nunca teria callback do Eupago.
// Multibanco não precisa disto — a referência continua válida 2 dias, sem
// necessidade de expiração antecipada (mesmo comportamento de orders).
export async function expirarQuotaPendentes(): Promise<void> {
  const limite = new Date(Date.now() - MBWAY_EXPIRA_APOS_MINUTOS * 60 * 1000);
  await db
    .update(quotaPagamentos)
    .set({ status: "expirado" })
    .where(and(eq(quotaPagamentos.status, "pendente"), eq(quotaPagamentos.metodoPagamento, "mbway"), lt(quotaPagamentos.createdAt, limite)));
}
