"use client";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import eventosData from "@/data/eventos.json";

interface Evento {
  id: string;
  titulo: string;
  local: string;
  data: string;
  descricao: string;
  destaque: boolean;
  pasta: string;
  fotos: string[];
}

const eventos = eventosData as Evento[];

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function mesDe(data: string) {
  const partes = data.split("-");
  if (partes.length < 2) return "";
  return MESES[parseInt(partes[1]) - 1];
}

function agruparPorAno(lista: Evento[]) {
  const grupos: Record<string, Evento[]> = {};
  lista.forEach((ev) => {
    const ano = ev.data.split("-")[0];
    if (!grupos[ano]) grupos[ano] = [];
    grupos[ano].push(ev);
  });
  return grupos;
}

export default function EventosTimeline() {
  const grupos = agruparPorAno(eventos);
  const anos = Object.keys(grupos).sort();
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  let globalIndex = 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, []);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const edgeZone = 250;
    const x = e.clientX - rect.left;

    if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);

    const step = () => {
      if (!container) return;
      if (x < edgeZone) {
        container.scrollLeft -= 2;
      } else if (x > rect.width - edgeZone) {
        container.scrollLeft += 2;
      } else {
        return;
      }
      autoScrollRef.current = requestAnimationFrame(step);
    };

    if (x < edgeZone || x > rect.width - edgeZone) {
      autoScrollRef.current = requestAnimationFrame(step);
    }
  };

  const handleMouseLeave = () => {
    if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => scrollByAmount(-700)}
        className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronLeft size={56} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => scrollByAmount(700)}
        className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronRight size={56} strokeWidth={2.5} />
      </button>

      <div
        ref={scrollRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full overflow-x-auto overflow-y-visible scrollbar-hide"
        style={{
          maskImage: "linear-gradient(to right, transparent 0px, black 70px, black calc(100% - 70px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0px, black 70px, black calc(100% - 70px), transparent 100%)",
        }}
      >
        <div
          className="flex items-end gap-8 py-4 w-max mx-auto"
          style={{ paddingLeft: "360px", paddingRight: "360px" }}
        >
          {anos.map((ano) => (
            <div key={ano} className="flex flex-col items-center shrink-0 min-h-[440px] justify-end overflow-visible">
              <div className="flex items-end gap-2 md:gap-3 mb-4 [&:has(.evt-card:hover)_.evt-card:not(:hover)]:pointer-events-none">
                {grupos[ano].map((ev) => {
                  const rotate = globalIndex % 2 === 0 ? "-rotate-4" : "rotate-3";
                  globalIndex++;
                  const fotoHover1 = ev.fotos[1] ?? ev.fotos[0];
                  const fotoHover2 = ev.fotos[2] ?? ev.fotos[0];
                  return (
                    <Link
                      key={ev.id}
                      href={`/eventos/${ev.id}`}
                      className="evt-card group relative shrink-0 cursor-pointer"
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 text-xl opacity-100 group-hover:opacity-0 transition-opacity duration-300 select-none">
                        📌
                      </div>

                      <div
                        className={`bg-[#f5f5f3] shadow-[0_18px_35px_rgba(0,0,0,0.7)] transition-all duration-500 ease-out origin-bottom ${rotate}
                          group-hover:rotate-0 group-hover:z-20 group-hover:relative group-hover:w-[680px] group-hover:px-1 group-hover:py-2
                          ${ev.destaque
                            ? "w-[210px] md:w-[240px] p-4 pb-8"
                            : "w-[75px] md:w-[85px] p-1.5 pb-4"
                          }`}
                      >
                        <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-[300px] group-hover:opacity-100 group-hover:mb-2 transition-all duration-500">
                          <div className="flex gap-1">
                            <div
                              className="w-1/2 aspect-4/3 bg-cover bg-center"
                              style={{ backgroundImage: `url('/eventos/${ev.pasta}/${fotoHover1}')` }}
                            />
                            <div
                              className="w-1/2 aspect-4/3 bg-cover bg-center"
                              style={{ backgroundImage: `url('/eventos/${ev.pasta}/${fotoHover2}')` }}
                            />
                          </div>
                        </div>

                        <div
                          className={`w-full bg-cover bg-center transition-all duration-300 ease-out ${
                            ev.destaque ? "h-[170px] md:h-[195px]" : "h-[55px] md:h-[62px]"
                          } group-hover:h-0 group-hover:opacity-0`}
                          style={{ backgroundImage: `url('/eventos/${ev.pasta}/${ev.fotos[0]}')` }}
                        />

                        <div
                          className={`font-bold text-center text-black/85 mt-2 px-1 leading-tight transition-all duration-500 ${
                            ev.destaque ? "text-base md:text-lg" : "text-[10px] md:text-xs"
                          } group-hover:text-sm md:group-hover:text-base`}
                        >
                          {ev.titulo}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex gap-2 md:gap-3 mb-1">
                {grupos[ano].map((ev, i) => (
                  <div
                    key={i}
                    className={`text-center shrink-0 ${ev.destaque ? "w-[210px] md:w-[240px]" : "w-[75px] md:w-[85px]"} text-[10px] md:text-xs text-white/40 uppercase tracking-wide`}
                  >
                    {mesDe(ev.data)}
                  </div>
                ))}
              </div>
              <div className="text-orange-500/80 font-bold text-base md:text-lg tracking-wide border-t border-orange-500/30 pt-2 w-full text-center">
                {ano}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}