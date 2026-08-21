import { getTextos } from "@/lib/textos";
import SocialsAdminPanel from "@/components/admin/SocialsAdminPanel";

export default async function AdminSocialsPage() {
  const textos = await getTextos();

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Socials</h2>
      <SocialsAdminPanel textos={textos} />
    </div>
  );
}
