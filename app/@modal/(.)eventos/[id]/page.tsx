import { getEventoById } from "@/lib/eventos";
import EventoModal from "@/components/EventoModal";

export default async function EventoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = getEventoById(id);
  if (!evento) return null;
  return <EventoModal evento={evento} />;
}
