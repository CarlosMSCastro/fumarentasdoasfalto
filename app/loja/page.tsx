import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import LojaGrid from "@/components/LojaGrid";

export default function LojaPage() {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section id="loja" className="relative h-dvh w-full overflow-x-hidden md:overflow-visible snap-start">
        {/* Fundo partilhado com a Home, Sobre e Eventos — ver <SharedBackground /> no layout raiz */}
        <div className="relative z-10 flex h-full flex-col justify-start px-[8%] md:px-[13%] [@media(min-width:768px)_and_(max-width:1728px)]:px-[10%] pt-[clamp(7rem,14dvh,10rem)] md:pt-[clamp(12rem,19dvh,17rem)] pb-[clamp(2.5rem,5dvh,4rem)] md:pb-[clamp(4.5rem,8dvh,7rem)]">
          <div className="shrink-0 mb-4 md:mb-12 text-center">
            <p className="text-white/90 text-lg md:text-xl uppercase tracking-widest mb-0">A nossa</p>
            <h1 className="text-3xl md:text-6xl font-bold text-[#f8f0d9]">Loja</h1>
          </div>

          <LojaGrid />
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}
