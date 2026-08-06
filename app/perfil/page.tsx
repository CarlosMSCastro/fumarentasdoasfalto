import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSocioByEmail, getSocioById, type QuotagestSocio } from "@/lib/quotagest";
import AuthPageBackground from "@/components/AuthPageBackground";
import PerfilForm from "./PerfilForm";

type User = typeof users.$inferSelect;

// Se já sabemos o id do Quotagest (ligação automática anterior ou pesquisa
// manual), vai direto por id — só tenta por email na primeira vez, e nesse
// caso guarda o id encontrado para não repetir a pesquisa nas próximas
// visitas.
async function resolveSocio(user: User): Promise<QuotagestSocio | null> {
  if (user.quotagestId) return getSocioById(user.quotagestId);
  if (!user.email) return null;

  const socio = await getSocioByEmail(user.email);
  if (socio) await db.update(users).set({ quotagestId: socio.id }).where(eq(users.id, user.id));
  return socio;
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect("/login");

  // Se o Quotagest estiver em baixo ou a associação email/password mal
  // configurada, a página de perfil continua a funcionar — só a secção
  // "Sócio" fica sem dados (ver fallback no PerfilForm).
  const socio = await resolveSocio(user).catch(() => null);

  return (
    <AuthPageBackground align="end" verticalAlign="start">
      <PerfilForm user={user} socio={socio} />
    </AuthPageBackground>
  );
}
