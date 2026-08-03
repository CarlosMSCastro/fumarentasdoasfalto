import ContactoSection from "@/components/ContactosSection";
import FoundersSection from "@/components/FoundersSection";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function SobrePage() {
  return (
    <>
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <section className="relative h-dvh w-full overflow-hidden snap-start">
          {/* Fundo partilhado com a Home e o Eventos — ver <SharedBackground /> no layout raiz */}
          {/* Conteúdo */}
          <div className="relative z-10 flex h-full flex-col items-end justify-center text-right px-[8%] md:px-[15%]">
            <p className="text-white/50 text-2xl md:text-4xl uppercase tracking-widest mt-3 mb-1">A nossa</p>
            <h1 className="text-4xl font-bold text-[#f8f0d9] md:text-7xl mb-6">
              HISTÓRIA
            </h1>
            <p className="text-white/95 text-lg md:text-xl max-w-xl mb-3">
              Somos uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.
            </p>
            <p className="text-white/90 text-base md:text-lg max-w-xl mb-3">
              Nasceu o sonho a 15 de junho de 2024 e a associação foi criada a 29 de novembro de 2024. Foi criada por 14 amigos com o intuito de promover o convívio entre pessoas que gostem de veículos motorizados de duas rodas, principalmente motorizadas de fabrico nacional de 50cc. Contudo, a associação está recetiva a sócios que tenham outro tipo de motas ou mesmo que não tenham. A confraternização e a amizade são o lema desta associação.
            </p>
            <p className="text-white/85 text-base md:text-lg max-w-xl">
              Mantenha-se atualizado sobre os nossos eventos e novidades, incluindo dicas e informações relevantes. Entre em contacto connosco e partilhe as suas sugestões e comentários.
            </p>
          </div>
          {/* Scroll Indicator */}
          <ScrollIndicator targetId="fundadores" className="bottom-[2vh] z-20" />
        </section>
        <FoundersSection />
        <div className="snap-start">
          <ContactoSection />
        </div>
      </div>
    </>
  );
}
