"use client";
import Image from "next/image";
import ObjetivosDesktop from "@/components/ObjetivosDesktop";
import ObjetivosMobile from "@/components/ObjetivosMobile";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function ObjetivosSection() {
  return (
    <section id="sobre" className="flex flex-col items-center justify-center min-h-dvh pt-15 pb-22 md:py-30 gap-2 relative overflow-hidden snap-start snap-always">
      <Image
        src="/Objetivosbg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-l from-black/15 via-black/30 to-black/45" />
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-linear-to-t from-black/10 via-black/20 to-black/70" />
      <video
        className="absolute inset-0 w-full h-full object-cover object-[center_top] opacity-65 md:object-center md:opacity-40 pointer-events-none mix-blend-screen scale-x-[-1]"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="text-left w-full px-[8%] md:px-[13%] relative z-10 mt-10">
        <p className="text-white/90 uppercase tracking-widest text-3xl mb-1">Os nossos</p>
        <h2 className="text-4xl md:text-7xl font-bold text-white/90 mb-2">Objetivos</h2>
        <p className="text-white/70 text-lg md:text-xl max-w-2xl">
          Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.
        </p>
      </div>
      <ObjetivosDesktop />
      <ObjetivosMobile />
      <ScrollIndicator id="scroll-to-contactos" targetId="contactos" className="bottom-[1vh] z-20" />
    </section>
  );
}