import { getProdutos } from "@/lib/produtos";
import ProdutosAdminList from "@/components/admin/ProdutosAdminList";

export default async function AdminProdutosPage() {
  const produtos = await getProdutos();

  return (
    <div>
      <h2 className="text-lg font-bold text-white/90 mb-4">Produtos</h2>
      <ProdutosAdminList produtos={produtos} />
    </div>
  );
}
