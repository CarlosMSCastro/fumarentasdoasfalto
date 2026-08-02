"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ContactosSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import EventoConteudo from "@/components/EventoConteudo";
import type { Evento } from "@/lib/eventos";

export default function EventoPageClient({ evento }: { evento: Evento | undefined }) {
  const router = useRouter();
  const [backClicked, setBackClicked] = useState(false);

  // Acende a laranja rapidamente antes de voltar, em vez de navegar logo.
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setBackClicked(true);
    setTimeout(() => router.push("/eventos"), 200);
  };

  if (!evento) {
    return (
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <section className="relative h-dvh w-full flex flex-col items-center justify-center gap-6 snap-start overflow-hidden">
          <p className="relative z-10 text-white/70 text-lg">Evento não encontrado.</p>
          <Link
            href="/eventos"
            className="relative z-10 rounded-full bg-orange-500 px-6 py-3 text-white font-semibold hover:bg-orange-600 transition-all"
          >
            Voltar aos eventos
          </Link>
          <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
        </section>
        <div className="snap-start">
          <ContactosSection />
        </div>
      </div>
    );
  }

  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative min-h-dvh w-full snap-start">
        <div className="relative z-0 opacity-95 px-[8%] md:px-[13%] pt-40 md:pt-[clamp(7.5rem,7dvh,10rem)] pb-[clamp(4rem,6dvh,8rem)] md:pb-[clamp(6rem,7dvh,9dvh)]">
          <Link
            href="/eventos"
            onClick={handleBackClick}
            className={`inline-flex items-center gap-2 self-start transition-colors text-xs md:text-sm font-semibold uppercase tracking-widest mb-1 md:mb-3 ${
              backClicked ? "text-orange-500" : "text-white/90 hover:text-orange-500"
            }`}
          >
            <ArrowLeft size={18} />
            Voltar aos eventos
          </Link>

          <EventoConteudo evento={evento} />
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" compact />
      </section>

      <div className="snap-start">
        <ContactosSection />
      </div>
    </div>
  );
}
