"use server";

import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, quotaPagamentos } from "@/lib/db/schema";
import { getSocioByEmail, getSocioById } from "@/lib/quotagest";
import { gerarReferenciaMultibanco, pedirPagamentoMbway } from "@/lib/eupago";

export type QuotaPagamentoResultado =
  | { error: string }
  | {
      pagamentoId: string;
      metodoPagamento: "multibanco" | "mbway";
      referenciaMb?: { entidade: string; referencia: string; valor: number };
    };

// Chamado pelo próprio sócio autenticado em /perfil (nunca um admin em nome
// de outro) — usa o canal Eupago da Loja (gerarReferenciaMultibanco/
// pedirPagamentoMbway), não o do Quotagest. Ver lib/db/schema.ts
// (quotaPagamentos) para o porquê da tabela própria.
export async function pedirPagamentoQuota(
  metodoPagamento: "multibanco" | "mbway",
  telemovelMbway?: string
): Promise<QuotaPagamentoResultado> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) return { error: "Sessão expirada. Entra novamente." };

  // Recarrega o sócio a partir do Quotagest — nunca confia num valor vindo
  // do cliente, mesmo princípio de criarEncomenda (app/actions/encomendas.ts)
  // para preços de produtos.
  const socio = user.quotagestId
    ? await getSocioById(user.quotagestId)
    : user.email
      ? await getSocioByEmail(user.email)
      : null;
  if (!socio) return { error: "Não encontrámos o teu registo de sócio." };
  if (socio.quotaEmDia || socio.divida <= 0) return { error: "A tua quota já está em dia." };

  const telemovel = telemovelMbway?.trim() ?? "";
  if (metodoPagamento === "mbway") {
    if (!/^9\d{8}$/.test(telemovel)) return { error: "Indica um número MB WAY válido." };
    // Mesma regra de criarEncomenda — a dívida de quota é sempre 12€ hoje,
    // mas a guarda fica por segurança se isso mudar.
    if (socio.divida < 1) return { error: "O valor mínimo para pagamento por MB WAY é 1€." };
  }

  // Já existe um pedido em curso para este sócio? Devolve esse em vez de
  // criar outro em paralelo. Sem janela de tempo aqui de propósito: um MB
  // WAY pendente é sempre recente porque expirarQuotaPendentes() já o teria
  // apanhado (ver lib/expiracao.ts); um Multibanco pendente continua válido
  // por 2 dias, não faz sentido gerar uma referência nova enquanto a
  // primeira ainda serve.
  const [pendente] = await db
    .select()
    .from(quotaPagamentos)
    .where(and(eq(quotaPagamentos.userId, user.id), eq(quotaPagamentos.status, "pendente")))
    .limit(1);
  if (pendente) {
    return {
      pagamentoId: pendente.id,
      metodoPagamento: pendente.metodoPagamento as "multibanco" | "mbway",
      referenciaMb:
        pendente.referenciaMbEntidade && pendente.referenciaMbNumero
          ? { entidade: pendente.referenciaMbEntidade, referencia: pendente.referenciaMbNumero, valor: pendente.valorCentimos / 100 }
          : undefined,
    };
  }

  const [pagamento] = await db
    .insert(quotaPagamentos)
    .values({
      userId: user.id,
      quotagestId: socio.id,
      nome: socio.nome,
      email: user.email,
      valorCentimos: Math.round(socio.divida * 100),
      metodoPagamento,
      telemovelMbway: metodoPagamento === "mbway" ? telemovel : null,
    })
    .returning();

  const descricao = `Quota Fumarentas do Asfalto #${pagamento.id.slice(0, 8)}`;

  try {
    if (metodoPagamento === "multibanco") {
      const ref = await gerarReferenciaMultibanco({ identificador: `quota:${pagamento.id}`, valor: socio.divida, descricao });
      await db
        .update(quotaPagamentos)
        .set({ referenciaMbEntidade: ref.entidade, referenciaMbNumero: ref.referencia })
        .where(eq(quotaPagamentos.id, pagamento.id));
      return {
        pagamentoId: pagamento.id,
        metodoPagamento,
        referenciaMb: { entidade: ref.entidade, referencia: ref.referencia, valor: ref.valor },
      };
    }

    await pedirPagamentoMbway({ identificador: `quota:${pagamento.id}`, valor: socio.divida, descricao, telemovel });
    return { pagamentoId: pagamento.id, metodoPagamento };
  } catch (erro) {
    // Nunca deixar a linha presa em "pendente" sem referência nenhuma — isso
    // bloquearia qualquer nova tentativa (ver dedupe acima).
    await db.update(quotaPagamentos).set({ status: "cancelado" }).where(eq(quotaPagamentos.id, pagamento.id));
    return { error: erro instanceof Error ? erro.message : "Não foi possível iniciar o pagamento." };
  }
}
