import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socioLinkRequests } from "@/lib/db/schema";
import { getSocioById } from "@/lib/quotagest";
import AuthPageBackground from "@/components/AuthPageBackground";
import ConfirmarSocioForm from "./ConfirmarSocioForm";

export default async function ConfirmarSocioPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let nomeSocio: string | null = null;
  let erro: string | null = null;

  if (!token) {
    erro = "Link inválido.";
  } else {
    const [request] = await db.select().from(socioLinkRequests).where(eq(socioLinkRequests.token, token)).limit(1);
    if (!request || request.expires < new Date()) {
      erro = "Link inválido ou expirado. Pede a associação novamente no teu perfil.";
    } else {
      const socio = await getSocioById(request.quotagestId).catch(() => null);
      nomeSocio = socio?.nome ?? "este sócio";
    }
  }

  return (
    <AuthPageBackground>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#f8f0d9] mb-8 text-center">Confirmar associação</h1>
        {erro ? (
          <p className="text-red-400 text-center">{erro}</p>
        ) : (
          <>
            <p className="text-white/70 text-center mb-6">
              Vais ligar a tua conta ao registo de sócio de <span className="text-white font-semibold">{nomeSocio}</span>.
            </p>
            <ConfirmarSocioForm token={token as string} />
          </>
        )}
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </AuthPageBackground>
  );
}
