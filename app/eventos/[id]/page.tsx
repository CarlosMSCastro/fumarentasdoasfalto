import { getEventos, getEventoById } from "@/lib/eventos";
import EventoPageClient from "./EventoPageClient";

export function generateStaticParams() {
  return getEventos().map((evento) => ({ id: evento.id }));
}

export default async function EventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = getEventoById(id);
  return <EventoPageClient evento={evento} />;
}
