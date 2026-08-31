import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { objetivoFotos, objetivoCardIdEnum } from "@/lib/db/schema";

export type ObjetivoCardId = (typeof objetivoCardIdEnum.enumValues)[number];

// 3 linhas fixas — se por algum motivo uma faltar (seed incompleto), o
// componente público cai para a foto original hardcoded (ver
// ObjetivosDesktop.tsx/ObjetivosMobile.tsx), nunca mostra um <Image> partido.
// Invalidado via revalidateTag("objetivos") em admin-objetivos.ts.
export const getObjetivoFotos = unstable_cache(
  async (): Promise<Partial<Record<ObjetivoCardId, string>>> => {
    const rows = await db.select().from(objetivoFotos);
    return Object.fromEntries(rows.map((r) => [r.cardId, r.fotoUrl]));
  },
  ["objetivos"],
  { tags: ["objetivos"], revalidate: false }
);
