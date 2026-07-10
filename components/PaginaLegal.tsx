"use client";
import ContactoSection from "@/components/ContactosSection";

interface PaginaLegalProps {
  titulo: string;
  children: React.ReactNode;
}

export default function PaginaLegal({ titulo, children }: PaginaLegalProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-1 flex flex-col items-center px-[8%] md:px-[20%] py-48 md:py-56 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="relative z-10 w-full max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-bold text-white/90 mb-12 text-center">{titulo}</h1>
          <div className="text-white/70 text-sm md:text-base leading-normal space-y-6">
            {children}
          </div>
        </div>
      </div>
      <ContactoSection />
    </div>
  );
}