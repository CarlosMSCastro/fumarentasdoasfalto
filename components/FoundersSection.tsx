"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ScrollIndicator from "@/components/ScrollIndicator";
import fundadoresData from "@/data/fundadores.json";

interface Fundador {
  nome: string;
  cargo: string;
  foto: string;
}

const fundadores = fundadoresData as Fundador[];
const TAP_REVEAL_MS = 2000;

export default function FoundersSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    };
  }, []);

  const handleCardTap = (i: number) => {
    setActiveIndex(i);
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    activeTimeoutRef.current = setTimeout(() => setActiveIndex(null), TAP_REVEAL_MS);
  };

  return (
    <section id="fundadores" className="relative h-dvh w-full overflow-hidden snap-start">
      {/* Imagem de fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sobremimwallpaper2.jpg')" }}
      />
      {/* Overlay horizontal */}
      <div className="absolute inset-0 bg-linear-to-l from-black/55 via-black/65 to-black/65" />
      {/* Overlay vertical bottom */}
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50" />
      {/* Overlay vertical top */}
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/20 to-black/60" />
      {/* Vídeo do fumo */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none mix-blend-screen"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="relative z-10 flex h-full flex-col px-[8%] md:px-[13%] pt-[clamp(6.5rem,12dvh,9.5rem)] md:pt-[clamp(7.5rem,9dvh,10rem)] pb-[clamp(4.5rem,8dvh,7rem)]">
        <div className="shrink-0 mb-3 md:mb-6">
          <h2 className="text-4xl md:text-6xl font-bold text-white/90">Fundadores</h2>
        </div>

        <div
          className="flex-1 min-h-40 md:min-h-64 max-h-96 md:max-h-168 grid grid-flow-col auto-cols-[27vw] gap-1.5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-hide md:grid-flow-row md:auto-cols-auto md:grid-cols-7 md:gap-3 md:overflow-visible md:snap-none"
          style={{ gridTemplateRows: "repeat(2, minmax(0, 1fr))" }}
        >
          {fundadores.map((fundador, i) => (
            <div
              key={i}
              onClick={() => handleCardTap(i)}
              className="group relative overflow-hidden rounded-md bg-neutral-800 snap-start cursor-pointer"
            >
              <Image
                src={`/fundadores/${fundador.foto}`}
                alt={fundador.nome}
                fill
                sizes="(max-width: 768px) 27vw, 10vw"
                className={`object-cover transition-all duration-300 group-hover:brightness-75 ${activeIndex === i ? "brightness-75" : ""}`}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-black/10" />
              <div className="absolute inset-0 flex items-end p-1 md:p-2.5">
                <div className="relative w-full">
                  <span className={`block text-white font-bold uppercase leading-[0.85] text-[11px] sm:text-sm md:text-3xl transition-opacity duration-300 group-hover:opacity-0 ${activeIndex === i ? "opacity-0" : ""}`}>
                    {fundador.nome}
                  </span>
                  <span className={`absolute inset-0 flex items-end text-orange-500 font-bold uppercase leading-[0.85] text-[11px] sm:text-sm md:text-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${activeIndex === i ? "opacity-100" : ""}`}>
                    {fundador.cargo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
    </section>
  );
}
