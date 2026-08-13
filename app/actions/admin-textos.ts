"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conteudoTexto, paginaLegalSeccoes } from "@/lib/db/schema";
import type { TextoChave, PaginaLegalId } from "@/lib/textos";
import { exigirAdmin } from "@/lib/admin-auth";

// Todas as páginas públicas que leem texto/secções legais — mais simples e
// barato revalidar tudo do que tentar adivinhar exatamente qual mudou por
// cada chave/secção.
function revalidarTextos() {
  revalidatePath("/admin/conteudo/textos");
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/termos");
  revalidatePath("/privacidade");
  revalidatePath("/cookies");
}

export async function atualizarTextoAdmin(chave: TextoChave, valor: string): Promise<{ error?: string }> {
  await exigirAdmin();
  const valorTratado = valor.trim();
  if (!valorTratado) return { error: "O texto não pode ficar vazio." };

  await db.insert(conteudoTexto).values({ chave, valor: valorTratado }).onConflictDoUpdate({
    target: conteudoTexto.chave,
    set: { valor: valorTratado },
  });

  revalidarTextos();
  return {};
}

export async function criarSeccaoLegalAdmin(
  pagina: PaginaLegalId,
  dados: { subtitulo: string; corpo: string }
): Promise<{ error?: string }> {
  await exigirAdmin();
  const corpo = dados.corpo.trim();
  if (!corpo) return { error: "O texto da secção não pode ficar vazio." };

  const [ultima] = await db
    .select({ ordem: paginaLegalSeccoes.ordem })
    .from(paginaLegalSeccoes)
    .where(eq(paginaLegalSeccoes.pagina, pagina))
    .orderBy(desc(paginaLegalSeccoes.ordem))
    .limit(1);
  const ordem = (ultima?.ordem ?? -1) + 1;

  await db.insert(paginaLegalSeccoes).values({ pagina, ordem, subtitulo: dados.subtitulo.trim(), corpo });
  revalidarTextos();
  return {};
}

export async function atualizarSeccaoLegalAdmin(id: string, dados: { subtitulo: string; corpo: string }): Promise<{ error?: string }> {
  await exigirAdmin();
  const corpo = dados.corpo.trim();
  if (!corpo) return { error: "O texto da secção não pode ficar vazio." };

  await db.update(paginaLegalSeccoes).set({ subtitulo: dados.subtitulo.trim(), corpo }).where(eq(paginaLegalSeccoes.id, id));
  revalidarTextos();
  return {};
}

export async function apagarSeccaoLegalAdmin(id: string): Promise<void> {
  await exigirAdmin();
  await db.delete(paginaLegalSeccoes).where(eq(paginaLegalSeccoes.id, id));
  revalidarTextos();
}
