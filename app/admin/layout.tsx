import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Só o gate de admin, partilhado por todas as rotas do painel — cada página/
// layout de baixo escolhe o próprio fundo/alinhamento (ver app/admin/page.tsx
// vs app/admin/(painel)/layout.tsx), por isso este não renderiza UI nenhuma.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return <>{children}</>;
}
