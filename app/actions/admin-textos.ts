"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conteudoTexto, paginaLegalSeccoes } from "@/lib/db/schema";
import type { TextoChave, PaginaLegalId } from "@/lib/textos";
import { exigirAdmin } from "@/lib/admin-auth";

// Todas as páginas públicas que leem texto/secções legais — mais simples e
// barato revalidar tudo do que tentar adivinhar exatamente qual mudou por
// cada chave/secção. O "layout" no primeiro revalidatePath cobre o Navbar
// (renderizado no layout raiz, chaves social.*) — sem isto, editar um link
// de rede social só atualizava nas páginas listadas abaixo, não em todas.
// Limites de caracteres para os campos do Hero (homepage) e do texto do
// Sobre — mesma razão e calibração descritas em TextosAdminList.tsx (secções
// h-dvh fixas, não crescem como Loja/Fundadores; ver nota lá). O maxLength no
// <input>/<textarea> já impede isto na UI, mas alguém a chamar esta action
// diretamente (fora do formulário) contornava isso — reforço aqui para a
// garantia valer a sério, não só na UI.
const LIMITES_CARACTERES: Partial<Record<TextoChave, number>> = {
  "home.hero.label": 40,
  "home.hero.titulo": 40,
  "home.hero.descricao": 250,
  "sobre.label": 40,
  "sobre.titulo": 40,
  "sobre.paragrafo1": 250,
  "sobre.paragrafo2": 700,
  "sobre.paragrafo3": 350,
};

function revalidarTextos() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/conteudo/textos");
  revalidatePath("/admin/conteudo/socials");
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
  const limite = LIMITES_CARACTERES[chave];
  if (limite !== undefined && valorTratado.length > limite) {
    return { error: `Este campo não pode passar de ${limite} caracteres.` };
  }

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
