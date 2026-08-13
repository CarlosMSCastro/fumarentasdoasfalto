import { getEventos, getEventoById } from "@/lib/eventos";
import EventoPageClient from "./EventoPageClient";

export async function generateStaticParams() {
  const eventos = await getEventos();
  return eventos.map((evento) => ({ id: evento.id }));
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
