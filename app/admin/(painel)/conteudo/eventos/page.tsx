import { getTodosEventos } from "@/lib/eventos";
import EventosAdminList from "@/components/admin/EventosAdminList";

export default async function AdminEventosPage() {
  const eventos = await getTodosEventos();

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Eventos</h2>
      <EventosAdminList eventos={eventos} />
    </div>
  );
}
