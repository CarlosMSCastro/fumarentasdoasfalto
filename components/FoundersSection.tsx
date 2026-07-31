"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ScrollIndicator from "@/components/ScrollIndicator";
import { getFundadores } from "@/lib/fundadores";

const fundadores = getFundadores();
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
      {/* Fundo partilhado com a secção "História" — ver <SobreBackground /> */}
      <div className="relative z-10 flex h-full flex-col justify-center px-[8%] md:px-[13%] [@media(min-width:768px)_and_(max-width:1728px)]:px-[4%] pt-[clamp(6.5rem,12dvh,9.5rem)] md:pt-[clamp(7.5rem,9dvh,10rem)] pb-[clamp(4.5rem,8dvh,7rem)]">
        <div className="shrink-0 mb-3 md:mb-6">
          <h2 className="text-4xl md:text-6xl font-bold text-white/90">Fundadores</h2>
        </div>

        <div className="flex-1 min-h-32 md:min-h-52 md:max-h-136 grid grid-cols-3 auto-rows-fr gap-1.5 md:grid-cols-7 md:gap-3">
          {fundadores.map((fundador, i) => (
            <div
              key={i}
              onClick={() => handleCardTap(i)}
              className="group relative overflow-hidden bg-neutral-800 cursor-pointer"
            >
              <Image
                src={`/fundadores/${fundador.foto}`}
                alt={fundador.nome}
                fill
                sizes="(max-width: 768px) 28vw, 10vw"
                className={`object-cover transition-all duration-300 group-hover:brightness-70 ${activeIndex === i ? "brightness-70" : ""}`}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-black/10" />
              <div className="absolute inset-0 flex items-end p-1 md:p-2.5">
                <div className="relative w-full">
                  <span className={`block text-white font-bold uppercase leading-[0.85] text-lg sm:text-base md:text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-opacity duration-300 group-hover:opacity-0 ${activeIndex === i ? "opacity-0" : ""}`}>
                    {fundador.nome}
                  </span>
                  <span className={`absolute inset-0 flex items-end text-orange-500 font-bold uppercase leading-[0.85] text-lg sm:text-base md:text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${activeIndex === i ? "opacity-100" : ""}`}>
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
