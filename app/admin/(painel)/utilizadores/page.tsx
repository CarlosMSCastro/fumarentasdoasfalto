import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getTodosSocios } from "@/lib/quotagest";
import { marcarSecaoVista } from "@/lib/admin-notificacoes";
import UtilizadoresAdminList, { type UtilizadorAdmin } from "@/components/admin/UtilizadoresAdminList";

// Seleção explícita de colunas (nunca "select *") — garante que passwordHash
// nunca sai da BD, mesmo que o schema ganhe campos sensíveis novos no futuro.
async function getUtilizadoresComSocio(): Promise<UtilizadorAdmin[]> {
  await marcarSecaoVista("utilizadores");
  const [todosUsers, socios] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        phone: users.phone,
        addressLine: users.addressLine,
        postalCode: users.postalCode,
        city: users.city,
        quotagestId: users.quotagestId,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    // Falha suave — sem sócios do Quotagest a lista de utilizadores continua
    // a mostrar-se, só sem a associação a sócio (mesmo princípio do
    // resolveSocio em app/perfil/page.tsx).
    getTodosSocios().catch(() => []),
  ]);

  const socioPorId = new Map(socios.map((socio) => [socio.id, socio]));
  return todosUsers.map((user) => ({
    ...user,
    socio: user.quotagestId ? (socioPorId.get(user.quotagestId) ?? null) : null,
  }));
}

export default async function AdminUtilizadoresPage() {
  const utilizadores = await getUtilizadoresComSocio();

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[#f8f0d9] mb-8">Utilizadores</h1>
      <UtilizadoresAdminList utilizadores={utilizadores} />
    </div>
  );
}
