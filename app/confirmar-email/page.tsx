import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailChangeRequests } from "@/lib/db/schema";
import AuthPageBackground from "@/components/AuthPageBackground";
import ConfirmarEmailForm from "./ConfirmarEmailForm";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let newEmail: string | null = null;
  let erro: string | null = null;

  if (!token) {
    erro = "Link inválido.";
  } else {
    const [request] = await db.select().from(emailChangeRequests).where(eq(emailChangeRequests.token, token)).limit(1);
    if (!request || request.expires < new Date()) {
      erro = "Link inválido ou expirado. Pede a alteração novamente no teu perfil.";
    } else {
      newEmail = request.newEmail;
    }
  }

  return (
    <AuthPageBackground>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#f8f0d9] mb-8 text-center">Confirmar email</h1>
        {erro ? (
          <p className="text-red-400 text-center">{erro}</p>
        ) : (
          <>
            <p className="text-white/70 text-center mb-6">
              Vais alterar o email da tua conta para <span className="text-white font-semibold">{newEmail}</span>.
            </p>
            <ConfirmarEmailForm token={token as string} />
          </>
        )}
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </AuthPageBackground>
  );
}
