import type { Metadata } from "next";
import { getEventos, getEventoById } from "@/lib/eventos";
import EventoPageClient from "./EventoPageClient";

export async function generateStaticParams() {
  const eventos = await getEventos();
  return eventos.map((evento) => ({ id: evento.id }));
}

// Dinâmico por natureza — cada evento (presente ou futuro, criado pelo
// admin) tem título/descrição próprios já na BD, nunca precisa de ser
// atualizado à mão. Sem fallback explícito de título/descrição aqui: se o
// evento não existir, deixa herdar o metadata genérico do layout raiz.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const evento = await getEventoById(id);
  if (!evento) return {};

  return {
    title: evento.titulo,
    description: evento.descricao || undefined,
    openGraph: { title: evento.titulo, description: evento.descricao || undefined, images: [evento.capaUrl] },
    twitter: { title: evento.titulo, description: evento.descricao || undefined, images: [evento.capaUrl] },
  };
}

export default async function EventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = await getEventoById(id);
  return <EventoPageClient evento={evento} />;
}
