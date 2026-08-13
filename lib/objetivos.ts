import "server-only";
import { db } from "@/lib/db";
import { objetivoFotos, objetivoCardIdEnum } from "@/lib/db/schema";

export type ObjetivoCardId = (typeof objetivoCardIdEnum.enumValues)[number];

// 3 linhas fixas — se por algum motivo uma faltar (seed incompleto), o
// componente público cai para a foto original hardcoded (ver
// ObjetivosDesktop.tsx/ObjetivosMobile.tsx), nunca mostra um <Image> partido.
export async function getObjetivoFotos(): Promise<Partial<Record<ObjetivoCardId, string>>> {
  const rows = await db.select().from(objetivoFotos);
  return Object.fromEntries(rows.map((r) => [r.cardId, r.fotoUrl]));
}
