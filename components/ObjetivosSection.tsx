"use client";
import ObjetivosDesktop from "@/components/ObjetivosDesktop";
import ObjetivosMobile from "@/components/ObjetivosMobile";

export default function ObjetivosSection() {
  return (
    <section id="sobre" className="flex flex-col items-center justify-center min-h-screen pt-12 pb-22 md:py-30 gap-12 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="text-left mb-4 md:mb-12 w-full px-[8%] md:px-[13%] relative z-10">
        <p className="text-white/90 uppercase tracking-widest text-3xl mb-2">Os nossos</p>
        <h2 className="text-4xl md:text-7xl font-bold text-white/90 mb-4">Objetivos</h2>
        <p className="text-white/50 text-lg md:text-xl max-w-2xl">
          Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.
        </p>
      </div>
      <ObjetivosDesktop />
      <ObjetivosMobile />
    </section>
  );
}