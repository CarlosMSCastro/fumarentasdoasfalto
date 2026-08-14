import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Reforço a par do disallow em app/robots.ts — o robots.txt é só um pedido,
// não um bloqueio real, isto garante noindex mesmo que algo aceda direto.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Só o gate de admin, partilhado por todas as rotas do painel — cada página/
// layout de baixo escolhe o próprio fundo/alinhamento (ver app/admin/page.tsx
// vs app/admin/(painel)/layout.tsx), por isso este não renderiza UI nenhuma.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return <>{children}</>;
}
