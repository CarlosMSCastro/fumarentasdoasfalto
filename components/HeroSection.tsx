import ScrollIndicator from "@/components/ScrollIndicator";
import { getTextos } from "@/lib/textos";

export default async function HeroSection() {
  const textos = await getTextos();

  return (
    <section className="relative h-dvh w-full overflow-hidden snap-start snap-always">
      {/* Conteúdo — o fundo é o <SharedBackground /> (layout raiz), partilhado com a ObjetivosSection, o Sobre e o Eventos */}
      <div className="relative z-10 flex h-full flex-col items-start justify-center text-left px-[8%] md:px-[15%] mt-15">
        <p className="text-white/80 text-lg uppercase tracking-widest mb-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{textos["home.hero.label"]}</p>
        <h1 className="text-5xl font-bold text-[#f8f0d9] md:text-6xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {textos["home.hero.titulo"]}
        </h1>
        <p className="mt-4 text-lg text-white/80 max-w-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {textos["home.hero.descricao"]}
        </p>
        <div className="pt-20 md:pt-22 flex gap-8 self-center">
          <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" target="_blank" rel="noopener noreferrer" className="rounded-full bg-orange-500 px-4 py-3 md:w-55 w-40 text-center md:text-lg text-md font-semibold text-white hover:bg-orange-600">
            Novo Sócio
          </a>
          <a href="https://quolagest-wwit.quotagest.com/portal/login" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white px-4 py-3 md:w-55 w-40 text-center md:text-lg text-md font-semibold text-white hover:bg-white/10">
            Portal do Sócio
          </a>
        </div>
      </div>
      {/* Scroll Indicator */}
      <ScrollIndicator targetId="sobre" className="bottom-[2vh] lg:bottom-15 z-10" />
    </section>
  );
}
