import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  const user = session?.user?.id
    ? (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0]
    : undefined;

  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section id="checkout" className="relative h-dvh w-full overflow-visible snap-start">
        {/* Fundo partilhado com a Home, Sobre, Eventos e Loja — ver <SharedBackground /> no layout raiz */}
        <div className="relative z-10 flex h-full flex-col justify-start px-[8%] md:px-[13%] [@media(min-width:768px)_and_(max-width:1728px)]:px-[10%] pt-[clamp(7rem,13dvh,9.5rem)] md:pt-[clamp(8.5rem,14dvh,12rem)] pb-[clamp(2rem,4dvh,3.5rem)] md:pb-[clamp(3rem,6dvh,5rem)]">
          <div className="shrink-0 mb-3 md:mb-6 text-center">
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

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}
