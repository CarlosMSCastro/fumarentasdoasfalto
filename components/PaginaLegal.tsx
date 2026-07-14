"use client";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";

interface PaginaLegalProps {
  titulo: string;
  children: React.ReactNode;
}

export default function PaginaLegal({ titulo, children }: PaginaLegalProps) {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <div className="relative snap-start h-dvh flex flex-col items-center px-[5%] md:px-[10%] py-32 md:py-40 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="relative z-10 w-full max-w-4xl">
          <h1 className="text-xl md:text-3xl font-bold mt-8 md:mt-0 text-white/90 mb-8 text-center">{titulo}</h1>
          <div className="text-white/70 text-xs md:text-sm leading-normal space-y-1">
            {children}
          </div>
        </div>
        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </div>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}