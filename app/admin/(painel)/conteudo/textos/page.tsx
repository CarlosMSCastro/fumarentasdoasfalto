import { getTextos, getSeccoesLegais } from "@/lib/textos";
import TextosAdminList from "@/components/admin/TextosAdminList";

export default async function AdminTextosPage() {
  const [textos, seccoesTermos, seccoesPrivacidade, seccoesCookies] = await Promise.all([
    getTextos(),
    getSeccoesLegais("termos"),
    getSeccoesLegais("privacidade"),
    getSeccoesLegais("cookies"),
  ]);

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Textos</h2>
      <TextosAdminList
        textos={textos}
        seccoesTermos={seccoesTermos}
        seccoesPrivacidade={seccoesPrivacidade}
        seccoesCookies={seccoesCookies}
      />
    </div>
  );
}
