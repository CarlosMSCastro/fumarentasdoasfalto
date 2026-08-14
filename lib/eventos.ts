import "server-only";
import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos, eventoFotos } from "@/lib/db/schema";

export type Evento = {
  id: string;
  titulo: string;
  local: string;
  data: string;
  descricao: string;
  destaque: boolean;
  mostrar: boolean;
  capaUrl: string;
  fotos: string[];
};

type EventoRow = typeof eventos.$inferSelect;

async function comFotos(linhas: EventoRow[]): Promise<Evento[]> {
  if (linhas.length === 0) return [];
  const fotos = await db
    .select()
    .from(eventoFotos)
    .where(inArray(eventoFotos.eventoId, linhas.map((e) => e.id)))
    .orderBy(asc(eventoFotos.ordem));
  return linhas.map((ev) => ({
    ...ev,
    fotos: fotos.filter((f) => f.eventoId === ev.id).map((f) => f.url),
  }));
}

// Só os eventos com mostrar=true — para uso público (timeline). Ver
// getTodosEventos() para o painel de admin, que precisa de ver também os
// escondidos.
export async function getEventos(): Promise<Evento[]> {
  const linhas = await db.select().from(eventos).where(eq(eventos.mostrar, true)).orderBy(asc(eventos.data));
  return comFotos(linhas);
}

export async function getTodosEventos(): Promise<Evento[]> {
  const linhas = await db.select().from(eventos).orderBy(asc(eventos.data));
  return comFotos(linhas);
}

// mostrar=false esconde tanto da timeline como da própria página
// /eventos/[id] — o admin não usa esta função, vê tudo via getTodosEventos().
export async function getEventoById(id: string): Promise<Evento | undefined> {
  const [linha] = await db
    .select()
    .from(eventos)
    .where(and(eq(eventos.id, id), eq(eventos.mostrar, true)))
    .limit(1);
  if (!linha) return undefined;
  const [evento] = await comFotos([linha]);
  return evento;
}
