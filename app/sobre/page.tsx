import ContactoSection from "@/components/ContactosSection";
import FoundersSection from "@/components/FoundersSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import { getFundadores } from "@/lib/fundadores";
import { getTextos } from "@/lib/textos";

export default async function SobrePage() {
  const [fundadores, textos] = await Promise.all([getFundadores(), getTextos()]);

  return (
    <>
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <section className="relative h-dvh w-full overflow-hidden snap-start">
          {/* Fundo partilhado com a Home e o Eventos — ver <SharedBackground /> no layout raiz */}
          {/* Conteúdo */}
          <div className="relative z-10 flex h-full flex-col items-end justify-center text-right px-[8%] md:px-[15%]">
            <p className="text-white/50 text-2xl md:text-4xl uppercase tracking-widest mt-3 mb-1">{textos["sobre.label"]}</p>
            <h1 className="text-4xl font-bold text-[#f8f0d9] md:text-7xl mb-6">
              {textos["sobre.titulo"]}
            </h1>
            <p className="text-white/95 text-lg md:text-xl max-w-xl mb-3">
              {textos["sobre.paragrafo1"]}
            </p>
            <p className="text-white/90 text-base md:text-lg max-w-xl mb-3">
              {textos["sobre.paragrafo2"]}
            </p>
            <p className="text-white/85 text-base md:text-lg max-w-xl">
              {textos["sobre.paragrafo3"]}
            </p>
          </div>
          {/* Scroll Indicator */}
          <ScrollIndicator targetId="fundadores" className="bottom-[2vh] z-20" />
        </section>
        <FoundersSection fundadores={fundadores} />
        <div className="snap-start">
          <ContactoSection />
        </div>
      </div>
    </>
  );
}
