import { getObjetivoFotos } from "@/lib/objetivos";
import ObjetivosAdminPanel from "@/components/admin/ObjetivosAdminPanel";

export default async function AdminObjetivosPage() {
  const fotos = await getObjetivoFotos();

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Objetivos</h2>
      <ObjetivosAdminPanel fotos={fotos} />
    </div>
  );
}
