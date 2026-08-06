import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import AuthPageBackground from "@/components/AuthPageBackground";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  const user = session?.user?.id
    ? (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0]
    : undefined;

  return (
    <AuthPageBackground verticalAlign="start">
      <div className="w-full max-w-4xl pt-16 md:pt-28">
        <div className="mb-6 md:mb-10 text-center">
          <p className="text-white/90 text-lg md:text-xl uppercase tracking-widest mb-0">Finalizar</p>
          <h1 className="text-3xl md:text-6xl font-bold text-[#f8f0d9]">Compra</h1>
        </div>

        <CheckoutForm
          initial={{
            nome: user?.name ?? session?.user?.name ?? "",
            email: user?.email ?? session?.user?.email ?? "",
            telefone: user?.phone ?? "",
            moradaLinha: user?.addressLine ?? "",
            codigoPostal: user?.postalCode ?? "",
            cidade: user?.city ?? "",
          }}
        />
      </div>
    </AuthPageBackground>
  );
}
