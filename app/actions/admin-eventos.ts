"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos, eventoFotos } from "@/lib/db/schema";
import { exigirAdmin } from "@/lib/admin-auth";
import { validarFoto, carregarFoto, apagarFoto } from "@/lib/upload";

function revalidarEventos(id?: string) {
  revalidatePath("/admin/conteudo/eventos");
  revalidatePath("/eventos");
  if (id) revalidatePath(`/eventos/${id}`);
}

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Sem utilitário de slugify no projeto até agora — só os Eventos precisam
// (Fundadores/Produtos usam uuid, sem necessidade de URL bonita). Dedup com
// sufixo -2, -3... se já existir um evento com o mesmo slug.
async function gerarIdUnico(titulo: string): Promise<string> {
  const base = slugify(titulo) || "evento";
  let id = base;
  let sufixo = 2;
  for (;;) {
    const [existente] = await db.select({ id: eventos.id }).from(eventos).where(eq(eventos.id, id)).limit(1);
    if (!existente) return id;
    id = `${base}-${sufixo}`;
    sufixo++;
  }
}

// A primeira foto carregada é sempre a capa inicial — pode ser trocada
// depois via escolherCapaEventoAdmin. destaque não é editável aqui (fica de
// fora do âmbito pedido), novos eventos entram sempre com destaque=false.
export async function criarEventoAdmin(formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const local = String(formData.get("local") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!titulo) return { error: "Indica o título." };
  if (!local) return { error: "Indica o local." };
  if (!data) return { error: "Indica a data." };

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const id = await gerarIdUnico(titulo);
  const fotoUrl = await carregarFoto(`eventos/${id}/${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);

  await db.insert(eventos).values({ id, titulo, local, data, descricao, capaUrl: fotoUrl });
  await db.insert(eventoFotos).values({ eventoId: id, url: fotoUrl, ordem: 0 });

  revalidarEventos(id);
  return {};
}

export async function atualizarEventoAdmin(
  id: string,
  dados: { titulo: string; local: string; data: string; descricao: string }
): Promise<{ error?: string }> {
  await exigirAdmin();

  const titulo = dados.titulo.trim();
  const local = dados.local.trim();
  const data = dados.data.trim();
  if (!titulo) return { error: "Indica o título." };
  if (!local) return { error: "Indica o local." };
  if (!data) return { error: "Indica a data." };

  await db.update(eventos).set({ titulo, local, data, descricao: dados.descricao.trim() }).where(eq(eventos.id, id));
  revalidarEventos(id);
  return {};
}

export async function definirMostrarEventoAdmin(id: string, mostrar: boolean): Promise<void> {
  await exigirAdmin();
  await db.update(eventos).set({ mostrar }).where(eq(eventos.id, id));
  revalidarEventos(id);
}

export async function adicionarFotoEventoAdmin(id: string, formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const [ultima] = await db
    .select({ ordem: eventoFotos.ordem })
    .from(eventoFotos)
    .where(eq(eventoFotos.eventoId, id))
    .orderBy(desc(eventoFotos.ordem))
    .limit(1);
  const ordem = (ultima?.ordem ?? -1) + 1;

  const url = await carregarFoto(`eventos/${id}/${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);
  await db.insert(eventoFotos).values({ eventoId: id, url, ordem });

  revalidarEventos(id);
  return {};
}

// Recebe eventoId+url (não um id de evento_foto) — a lista pública de
// fotos (Evento.fotos) só expõe URLs, nunca os ids internos da tabela; a
// linha exata é encontrada aqui pela combinação eventoId+url, que é única.
// Nunca deixa um evento sem nenhuma foto (capaUrl é notNull) — bloqueia
// apagar a última que resta. Se a foto apagada era a capa, escolhe a
// primeira que sobrar como nova capa.
export async function apagarFotoEventoAdmin(eventoId: string, url: string): Promise<{ error?: string }> {
  await exigirAdmin();

  const [foto] = await db
    .select()
    .from(eventoFotos)
    .where(and(eq(eventoFotos.eventoId, eventoId), eq(eventoFotos.url, url)))
    .limit(1);
  if (!foto) return {};

  const todas = await db.select().from(eventoFotos).where(eq(eventoFotos.eventoId, eventoId));
  if (todas.length <= 1) return { error: "Um evento precisa de ter pelo menos uma foto." };

  await db.delete(eventoFotos).where(eq(eventoFotos.id, foto.id));

  const [evento] = await db.select({ capaUrl: eventos.capaUrl }).from(eventos).where(eq(eventos.id, eventoId)).limit(1);
  if (evento?.capaUrl === foto.url) {
    const [restante] = await db
      .select()
      .from(eventoFotos)
      .where(eq(eventoFotos.eventoId, eventoId))
      .orderBy(asc(eventoFotos.ordem))
      .limit(1);
    if (restante) await db.update(eventos).set({ capaUrl: restante.url }).where(eq(eventos.id, eventoId));
  }

  await apagarFoto(foto.url);
  revalidarEventos(eventoId);
  return {};
}

export async function escolherCapaEventoAdmin(eventoId: string, fotoUrl: string): Promise<{ error?: string }> {
  await exigirAdmin();

  const [foto] = await db
    .select()
    .from(eventoFotos)
    .where(and(eq(eventoFotos.eventoId, eventoId), eq(eventoFotos.url, fotoUrl)))
    .limit(1);
  if (!foto) return { error: "Foto inválida." };

  await db.update(eventos).set({ capaUrl: fotoUrl }).where(eq(eventos.id, eventoId));
  revalidarEventos(eventoId);
  return {};
}

// Cascade na BD apaga evento_foto sozinho — limpeza do Blob feita à parte,
// em best-effort, depois do delete confirmado.
export async function apagarEventoAdmin(id: string): Promise<void> {
  await exigirAdmin();

  const fotos = await db.select({ url: eventoFotos.url }).from(eventoFotos).where(eq(eventoFotos.eventoId, id));
  await db.delete(eventos).where(eq(eventos.id, id));
  await Promise.all(fotos.map((f) => apagarFoto(f.url)));

  revalidarEventos();
}
