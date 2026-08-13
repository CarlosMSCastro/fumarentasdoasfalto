import ConteudoSubNav from "@/components/admin/ConteudoSubNav";

// Uma entrada só na sidebar ("Editar Conteúdo") com sub-navegação própria
// aqui dentro, em vez de 5 entradas novas na sidebar principal — estas 5
// áreas são todas "editar o que o visitante vê", com a mesma linguagem de
// UI, ao contrário de Encomendas/Sócios/Utilizadores que são domínios
// operacionais distintos.
export default function ConteudoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[#f8f0d9] mb-6">Editar Conteúdo</h1>
      <ConteudoSubNav />
      {children}
    </div>
  );
}
