import ObjetivosDesktop from "@/components/ObjetivosDesktop";
import ObjetivosMobile from "@/components/ObjetivosMobile";
import ScrollIndicator from "@/components/ScrollIndicator";
import { getObjetivoFotos } from "@/lib/objetivos";
import { getTextos } from "@/lib/textos";

export default async function ObjetivosSection() {
  const [fotos, textos] = await Promise.all([getObjetivoFotos(), getTextos()]);

  return (
    <section id="sobre" className="flex flex-col items-center justify-center min-h-dvh pt-15 pb-22 md:py-30 gap-2 relative overflow-hidden snap-start snap-always">
      {/* Fundo partilhado com a HeroSection, o Sobre e o Eventos — ver <SharedBackground /> no layout raiz */}
      <div className="text-left w-full px-[8%] md:px-[13%] relative z-10 mt-10">
        <p className="text-white/90 uppercase tracking-widest text-3xl mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{textos["home.objetivos.label"]}</p>
        <h2 className="text-4xl md:text-7xl font-bold text-[#f8f0d9] mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{textos["home.objetivos.titulo"]}</h2>
        <p className="text-white/70 text-lg md:text-xl max-w-2xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {textos["home.objetivos.descricao"]}
        </p>
      </div>
      <ObjetivosDesktop fotos={fotos} />
      <ObjetivosMobile fotos={fotos} />
      <ScrollIndicator id="scroll-to-contactos" targetId="contactos" className="bottom-[3vh] md:bottom-[1vh] z-20" />
    </section>
  );
}