import AuthPageBackground from "@/components/AuthPageBackground";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Grupo de rotas só para páginas do painel além do "Início" (/admin) — a
// sidebar só deve aparecer depois de se clicar num card, nunca na própria
// página de entrada. "(painel)" não entra no URL, /admin/encomendas
// continua igual.
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthPageBackground footer={false} verticalAlign="start" compactPaddingMobile wide>
      <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-10 pt-2 pb-24 md:pt-6">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </AuthPageBackground>
  );
}
