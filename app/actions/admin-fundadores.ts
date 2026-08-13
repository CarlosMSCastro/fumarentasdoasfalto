"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { fundadores } from "@/lib/db/schema";
import { exigirAdmin } from "@/lib/admin-auth";
import { validarFoto, carregarFoto, apagarFoto } from "@/lib/upload";

function revalidarFundadores() {
  revalidatePath("/admin/conteudo/fundadores");
  revalidatePath("/sobre");
}

// id gerado aqui (não defaultRandom() da BD) porque o caminho no Blob
// precisa do id antes da linha existir — faz-se o upload primeiro, com esse
// id, e só depois o insert usa o mesmo id.
export async function criarFundadorAdmin(formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  if (!nome) return { error: "Indica o nome." };
  if (!cargo) return { error: "Indica o cargo." };

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const [ultimo] = await db.select({ ordem: fundadores.ordem }).from(fundadores).orderBy(desc(fundadores.ordem)).limit(1);
  const ordem = (ultimo?.ordem ?? -1) + 1;

  const id = randomUUID();
  const fotoUrl = await carregarFoto(`fundadores/${id}-${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);

  await db.insert(fundadores).values({ id, nome, cargo, fotoUrl, ordem });
  revalidarFundadores();
  return {};
}

export async function atualizarFundadorAdmin(id: string, dados: { nome: string; cargo: string }): Promise<{ error?: string }> {
  await exigirAdmin();

  const nome = dados.nome.trim();
  const cargo = dados.cargo.trim();
  if (!nome) return { error: "Indica o nome." };
  if (!cargo) return { error: "Indica o cargo." };

  await db.update(fundadores).set({ nome, cargo }).where(eq(fundadores.id, id));
  revalidarFundadores();
  return {};
}

// Foto separada do resto dos dados (ação própria, ficheiro só se envia
// quando muda) — apaga a foto antiga do Blob em best-effort depois de a
// nova já estar guardada, nunca antes (não perder a antiga se o upload novo
// falhar a meio).
export async function trocarFotoFundadorAdmin(id: string, formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const [atual] = await db.select({ fotoUrl: fundadores.fotoUrl }).from(fundadores).where(eq(fundadores.id, id)).limit(1);
  if (!atual) return { error: "Fundador não encontrado." };

  const novaFotoUrl = await carregarFoto(`fundadores/${id}-${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);
  await db.update(fundadores).set({ fotoUrl: novaFotoUrl }).where(eq(fundadores.id, id));
  await apagarFoto(atual.fotoUrl);

  revalidarFundadores();
  return {};
}

export async function apagarFundadorAdmin(id: string): Promise<void> {
  await exigirAdmin();

  const [fundador] = await db.select({ fotoUrl: fundadores.fotoUrl }).from(fundadores).where(eq(fundadores.id, id)).limit(1);
  await db.delete(fundadores).where(eq(fundadores.id, id));
  if (fundador) await apagarFoto(fundador.fotoUrl);

  revalidarFundadores();
}
