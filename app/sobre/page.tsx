"use client";
import ContactoSection from "@/components/ContactosSection";
import Footer from "@/components/Footer";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function SobrePage() {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative h-dvh w-full overflow-hidden snap-start">
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/sobremimwallpaper.jpg')" }}
        />
        {/* Overlay horizontal */}
        <div className="absolute inset-0 bg-linear-to-l from-black/95 via-black/60 to-black/30" />
        {/* Overlay vertical bottom */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50" />
                {/* Overlay vertical bottom */}
        <div className="absolute inset-0 bg-linear-to-t from-transparent via-transparent to-black/70" />
        {/* Vídeo do fumo */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none mix-blend-screen"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col items-end justify-center text-right px-[8%] md:px-[15%]">
          <p className="text-white/50 text-xl md:text-3xl uppercase tracking-widest mt-3 mb-1">A nossa</p>
          <h1 className="text-3xl font-bold text-white md:text-6xl mb-6">
            HISTÓRIA
          </h1>
          <p className="text-white/80 text-md md:text-lg max-w-xl mb-4">
            Somos uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.
          </p>
          <p className="text-white/70 text-base max-w-xl mb-4">
            Nasceu o sonho a 15 de junho de 2024 e a associação foi criada a 29 de novembro de 2024. Foi criada por 14 amigos com o intuito de promover o convívio entre pessoas que gostem de veículos motorizados de duas rodas, principalmente motorizadas de fabrico nacional de 50cc. Contudo, a associação está recetiva a sócios que tenham outro tipo de motas ou mesmo que não tenham. A confraternização e a amizade são o lema desta associação.
          </p>
          <p className="text-white/60 text-base max-w-xl">
            Mantenha-se atualizado sobre os nossos eventos e novidades, incluindo dicas e informações relevantes. Entre em contacto connosco e partilhe as suas sugestões e comentários.
          </p>
        </div>
        {/* Scroll Indicator */}
        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>
      <div className="snap-start">
        <ContactoSection />
        <Footer />
      </div>
    </div>
  );
}