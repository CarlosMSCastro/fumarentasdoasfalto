"use client";
import { useRef, useEffect } from "react";
import ObjetivosDesktop from "@/components/ObjetivosDesktop";
import ObjetivosMobile from "@/components/ObjetivosMobile";

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
    <section id="sobre" className="flex flex-col items-center justify-center min-h-[100dvh] pt-15 pb-22 md:py-30 gap-2 relative overflow-hidden snap-start snap-always">
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
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
      <div className="text-left w-full px-[8%] md:px-[13%] relative z-10 mt-10">
        <p className="text-white/90 uppercase tracking-widest text-3xl mb-1">Os nossos</p>
        <h2 className="text-4xl md:text-7xl font-bold text-white/90 mb-2">Objetivos</h2>
        <p className="text-white/50 text-lg md:text-xl max-w-2xl">
          Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.
        </p>
      </div>
      <ObjetivosDesktop />
      <ObjetivosMobile />
      <button
        onClick={() => document.getElementById('contactos')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-[1vh] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer bg-transparent border-none group"
      >
        <svg className="w-8 h-8 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <svg className="-mt-5 w-9 h-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
}