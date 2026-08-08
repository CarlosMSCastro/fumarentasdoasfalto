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
      {/* Fundo partilhado com a secção "História" — ver <SharedBackground /> no layout raiz */}
      <div className="relative z-10 flex h-full flex-col justify-start px-[8%] md:px-[13%] [@media(min-width:768px)_and_(max-width:1728px)]:px-[10%] pt-[clamp(6.5rem,12dvh,9.5rem)] md:pt-[clamp(7.5rem,9dvh,10rem)] pb-[clamp(4.5rem,8dvh,7rem)]">
        <div className="shrink-0 mb-10 md:mb-16 ml-[10%]">
          <h2 className="text-4xl md:text-6xl font-bold text-[#f8f0d9]">Fundadores</h2>
        </div>

        <div className="w-[80%] mx-auto flex-1 min-h-[6.4rem] md:min-h-[10.4rem] md:max-h-[27.2rem] grid grid-cols-3 auto-rows-fr gap-2.5 md:grid-cols-7 md:gap-4">
          {fundadores.map((fundador, i) => {
            const rotate = i % 2 === 0 ? "-rotate-2" : "rotate-1.5";
            const hoverRotate = i % 2 === 0 ? "group-hover:rotate-2" : "group-hover:-rotate-1.5";
            return (
              <div
                key={i}
                onClick={() => handleCardTap(i)}
                className={`group relative h-full w-full flex flex-col rounded-sm overflow-hidden bg-[#f8f0d9] shadow-[0_18px_35px_rgba(0,0,0,100)] cursor-pointer transition-all duration-700 ease-out hover:z-10 ${rotate} ${hoverRotate}`}
              >
                <div className="relative flex-1 min-h-0 m-1 md:m-1.5 overflow-hidden rounded-sm">
                  <Image
                    src={`/fundadores/${fundador.foto}`}
                    alt={fundador.nome}
                    fill
                    sizes="(max-width: 768px) 28vw, 10vw"
                    className="object-cover"
                  />
                  <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
                  {/* Mobile só: cargo aparece sobre a foto ao tocar (não há
                      hover no telemóvel) — no desktop o cargo troca com o
                      nome na legenda por baixo, ver mais abaixo. Ao tocar, a
                      foto escurece e o texto do cargo aumenta para ficar
                      legível e em destaque. */}
                  <div
                    aria-hidden="true"
                    className={`md:hidden absolute inset-0 pointer-events-none bg-black/55 transition-opacity duration-300 ${
                      activeIndex === i ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span
                    className={`md:hidden absolute inset-0 flex items-center justify-center text-center px-1 text-white font-bold uppercase leading-[1.1] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-all duration-300 pointer-events-none ${
                      activeIndex === i ? "opacity-100 text-sm" : "opacity-0 text-[9px]"
                    }`}
                  >
                    {fundador.cargo}
                  </span>
                </div>
                <div className="relative shrink-0 px-1 pb-1 md:px-1.5 md:pb-2 md:min-h-[1.75rem] text-center">
                  <span className="block text-black/85 font-bold uppercase leading-[1.1] text-[10px] sm:text-[9px] md:text-xs md:transition-opacity md:duration-300 md:group-hover:opacity-0">
                    {fundador.nome}
                  </span>
                  {/* inset-0 + min-h no pai acima em vez de bottom-2: um cargo
                      com 2 linhas (nomes de cargo compridos, em janelas mais
                      estreitas) crescia para cima a partir do bottom-2 e
                      invadia a foto — agora fica centrado dentro de uma
                      caixa alta o suficiente para as 2 linhas. */}
                  <span className="hidden md:flex absolute inset-0 items-center justify-center px-1.5 text-orange-600 font-bold uppercase leading-[1.1] text-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {fundador.cargo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
    </section>
  );
}
