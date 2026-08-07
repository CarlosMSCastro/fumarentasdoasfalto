import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSocioByEmail, getSocioById, type QuotagestSocio } from "@/lib/quotagest";
import AuthPageBackground from "@/components/AuthPageBackground";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
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
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      {/* snap-start aqui é só para dar ao scroll-snap mandatory um ponto de
          descanso no topo (senão o único snap-start é o da ContactosSection
          e o browser salta logo para lá ao carregar) — o bloco continua com
          scroll livre lá dentro, não fica preso a h-dvh. */}
      <div className="snap-start">
        <AuthPageBackground align="end" verticalAlign="start" footer={false}>
          <PerfilForm user={user} socio={socio} />
        </AuthPageBackground>
        {/* O conteúdo tem altura variável (não é h-dvh como as outras
            páginas), por isso o indicador vai relative logo a seguir ao
            conteúdo em vez de absolute-bottom preso ao ecrã — ver mobile
            do PaginaLegal.tsx para o mesmo padrão. -mt-16 cancela parte do
            py-24 (padding de baixo) do AuthPageBackground para aproximar
            do botão de logout, que é a última peça do formulário. */}
        <ScrollIndicator targetId="contactos" className="relative -mt-16 mb-6 z-20 w-full flex justify-center" />
      </div>
      <ContactoSection />
    </div>
  );
}
