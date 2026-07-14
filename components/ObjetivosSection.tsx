"use client";
import { useRef, useEffect } from "react";
import ObjetivosDesktop from "@/components/ObjetivosDesktop";
import ObjetivosMobile from "@/components/ObjetivosMobile";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function ObjetivosSection() {
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video2Ref.current;
    if (v) {
      v.currentTime = 3;
      v.play();
    }
  }, []);

  return (
    <section id="sobre" className="flex flex-col items-center justify-center min-h-dvh pt-15 pb-22 md:py-30 gap-2 relative overflow-hidden snap-start snap-always">
      <video
        className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <video
        ref={video2Ref}
        className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none scale-x-[-1] scale-y-[-1]"
        src="/videos/smoke.mp4"
        muted
        loop
        playsInline
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black to-transparent z-10 pointer-events-none" />
      <div className="text-left w-full px-[8%] md:px-[13%] relative z-10 mt-10">
        <p className="text-white/90 uppercase tracking-widest text-3xl mb-1">Os nossos</p>
        <h2 className="text-4xl md:text-7xl font-bold text-white/90 mb-2">Objetivos</h2>
        <p className="text-white/50 text-lg md:text-xl max-w-2xl">
          Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.
        </p>
      </div>
      <ObjetivosDesktop />
      <ObjetivosMobile />
      <ScrollIndicator id="scroll-to-contactos" targetId="contactos" className="bottom-[1vh] z-20" />
    </section>
  );
}