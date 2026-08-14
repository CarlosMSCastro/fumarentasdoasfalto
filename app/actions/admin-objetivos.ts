"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { objetivoFotos } from "@/lib/db/schema";
import type { ObjetivoCardId } from "@/lib/objetivos";
import { exigirAdmin } from "@/lib/admin-auth";
import { validarFoto, carregarFoto, apagarFoto } from "@/lib/upload";

export async function trocarFotoObjetivoAdmin(cardId: ObjetivoCardId, formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const [atual] = await db.select({ fotoUrl: objetivoFotos.fotoUrl }).from(objetivoFotos).where(eq(objetivoFotos.cardId, cardId)).limit(1);

  const novaFotoUrl = await carregarFoto(`objetivos/${cardId}-${Date.now()}`, validacao.ficheiro);
  await db.update(objetivoFotos).set({ fotoUrl: novaFotoUrl }).where(eq(objetivoFotos.cardId, cardId));
  if (atual) await apagarFoto(atual.fotoUrl);

  revalidatePath("/admin/conteudo/objetivos");
  revalidatePath("/");
  return {};
}
