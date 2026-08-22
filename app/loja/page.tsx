import type { Metadata } from "next";
import Image from "next/image";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import LojaGrid from "@/components/LojaGrid";
import { getProdutos } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Loja",
  description: "Merchandise oficial da Fumarentas do Asfalto.",
};

export default async function LojaPage() {
  const produtos = await getProdutos();

  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section id="loja" className="relative min-h-dvh w-full overflow-visible snap-start">
        {/* Fundo partilhado com a Home, Sobre e Eventos — ver <SharedBackground /> no layout raiz */}
        <div className="relative z-10 flex h-full flex-col justify-start px-[8%] md:px-[13%] [@media(min-width:768px)_and_(max-width:1728px)]:px-[10%] pt-[clamp(9.5rem,17dvh,11.5rem)] md:pt-[clamp(12rem,19dvh,17rem)] pb-[clamp(2.5rem,5dvh,4rem)] md:pb-[clamp(4.5rem,8dvh,7rem)]">
          {/* mb-12 (não mb-8) só no mobile — pedido explícito 2026-08-22,
              pouco espaço entre o título e a primeira linha de produtos. */}
          <div className="shrink-0 mb-12 md:mb-10 relative text-center">
            <p className="text-white/90 text-lg md:text-xl uppercase tracking-widest mb-0">A nossa</p>
            <h1 className="text-3xl md:text-6xl font-bold text-[#f8f0d9]">Loja</h1>

            <div className="absolute right-4 md:right-8 bottom-0 inline-flex items-center gap-1 md:gap-1.5 bg-[#f8f0d9] rounded-full pl-1.5 pr-1 py-0.5 md:pl-2.5 md:pr-1.5 md:py-1 shadow-[0_8px_20px_rgba(0,0,0,60)]">
              <span className="hidden md:inline text-black/70 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                Pagamento fácil por
              </span>
              <div className="flex items-center gap-1">
                <Image src="/pagamento/Multibanco.png" alt="Multibanco" width={1920} height={2268} className="h-4 md:h-5 w-auto object-contain" />
                <Image src="/pagamento/Mbway.png" alt="MB WAY" width={1280} height={622} className="h-4 md:h-5 w-auto object-contain" />
              </div>
            </div>
          </div>

          <LojaGrid produtos={produtos} />
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}
