import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getTodosSocios } from "@/lib/quotagest";
import { marcarSecaoVista } from "@/lib/admin-notificacoes";
import SociosAdminList, { type SocioAdmin } from "@/components/admin/SociosAdminList";

// Falha suave — se o Quotagest estiver em baixo, a página mostra a lista
// vazia com um aviso em vez de rebentar o painel todo (mesmo princípio do
// resolveSocio em app/perfil/page.tsx).
async function getSociosComConta(): Promise<{ socios: SocioAdmin[]; erro: boolean }> {
  await marcarSecaoVista("socios");
  try {
    const [socios, contas] = await Promise.all([
      getTodosSocios(),
      db.select({ quotagestId: users.quotagestId }).from(users),
    ]);
    const idsComConta = new Set(contas.map((c) => c.quotagestId).filter((id): id is string => id !== null));
    return { socios: socios.map((socio) => ({ ...socio, temConta: idsComConta.has(socio.id) })), erro: false };
  } catch {
    return { socios: [], erro: true };
  }
}

export default async function AdminSociosPage() {
  const { socios, erro } = await getSociosComConta();

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[#f8f0d9] mb-8">Sócios</h1>
      {erro ? (
        <p className="text-red-400 text-base">Não foi possível carregar os sócios do Quotagest agora. Tenta mais tarde.</p>
      ) : (
        <SociosAdminList socios={socios} />
      )}
    </div>
  );
}
