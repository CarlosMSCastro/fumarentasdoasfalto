import { obterSociosParaComunicado, obterHistoricoComunicados } from "@/app/actions/admin-comunicados";
import ComunicadosAdminList from "@/components/admin/ComunicadosAdminList";

export default async function AdminComunicadosPage() {
  const [{ socios, invalidosCount, erro }, historico] = await Promise.all([
    obterSociosParaComunicado(),
    obterHistoricoComunicados(),
  ]);

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[#f8f0d9] mb-8">Comunicados</h1>
      {erro ? (
        <p className="text-red-400 text-base">Não foi possível carregar os sócios do Quotagest agora. Tenta mais tarde.</p>
      ) : (
        <ComunicadosAdminList socios={socios} invalidosCount={invalidosCount} historicoInicial={historico} />
      )}
    </div>
  );
}
