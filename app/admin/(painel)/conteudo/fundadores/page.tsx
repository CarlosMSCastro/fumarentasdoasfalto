import { getFundadores } from "@/lib/fundadores";
import FundadoresAdminList from "@/components/admin/FundadoresAdminList";

export default async function AdminFundadoresPage() {
  const fundadores = await getFundadores();

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Fundadores</h2>
      <FundadoresAdminList fundadores={fundadores} />
    </div>
  );
}
