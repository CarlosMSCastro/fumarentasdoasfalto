"use client";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
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
function formatarDataCompleta(data: string) {
  const partes = data.split("-");
  if (partes.length === 3) return `${partes[2]} ${MESES[parseInt(partes[1]) - 1]} ${partes[0]}`;
  if (partes.length === 2) return `${MESES[parseInt(partes[1]) - 1]} ${partes[0]}`;
  return partes[0];
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
const HOVER_WIDTH = 900;
const EDGE_BUFFER = 30;
export default function EventosTimeline() {
  const grupos = agruparPorAno(eventos);
  const anos = Object.keys(grupos).sort();
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(anos[0]);
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  let globalIndex = 0;

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hoveredId) return;
    const ev = eventos.find((e) => e.id === hoveredId);
    if (!ev || ev.fotos.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const current = prev[hoveredId] ?? 0;
        const next = (current + 1) % ev.fotos.length;
        return { ...prev, [hoveredId]: next };
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [hoveredId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const edgeZone = 550;
    const x = e.clientX - rect.left;
    if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    const step = () => {
      if (!container) return;
      if (x < edgeZone) {
        container.scrollLeft -= 3;
      } else if (x > rect.width - edgeZone) {
        container.scrollLeft += 3;
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

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closest = anos[0];
    let closestDist = Infinity;
    anos.forEach((ano) => {
      const el = yearRefs.current[ano];
      if (!el) return;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(elCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = ano;
      }
    });
    setCurrentYear(closest);
  };

  const ensureVisibleOnHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    const linkEl = e.currentTarget;
    const cardLeft = linkEl.offsetLeft;
    const cardWidthNow = linkEl.offsetWidth;
    const cardCenter = cardLeft + cardWidthNow / 2;
    const expandedLeft = cardCenter - HOVER_WIDTH / 2;
    const expandedRight = cardCenter + HOVER_WIDTH / 2;
    const visibleLeft = container.scrollLeft;
    const visibleRight = container.scrollLeft + container.clientWidth;
    if (expandedRight > visibleRight - EDGE_BUFFER) {
      container.scrollTo({ left: container.scrollLeft + (expandedRight - visibleRight) + EDGE_BUFFER, behavior: "smooth" });
    } else if (expandedLeft < visibleLeft + EDGE_BUFFER) {
      container.scrollTo({ left: container.scrollLeft - (visibleLeft - expandedLeft) - EDGE_BUFFER, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full">
      <button
        className="pointer-events-none absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronLeft size={96} strokeWidth={1} />
      </button>
      <button
        className="pointer-events-none absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronRight size={96} strokeWidth={1} />
      </button>
      <div
        ref={scrollRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
        className="w-full overflow-x-auto overflow-y-visible scrollbar-hide "
        style={{
          maskImage: "linear-gradient(to right, transparent 0px, black 100px, black calc(100% - 100px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0px, black 100px, black calc(100% - 100px), transparent 100%)",
        }}
      >
        <div
          className="relative flex items-end gap-8 py-4 w-max mx-auto"
          style={{ paddingLeft: "150px", paddingRight: "150px" }}
        >
          {anos.map((ano) => (
            <div key={ano} ref={(el) => { yearRefs.current[ano] = el; }} className="flex flex-col items-center shrink-0 min-h-110 justify-end overflow-visible">
              <div className="flex items-end gap-2 md:gap-3 mb-4 h-115 z-30">
                {grupos[ano].map((ev) => {
                  const rotate = globalIndex % 2 === 0 ? "-rotate-4" : "rotate-3";
                  globalIndex++;
                  const idx = carouselIndex[ev.id] ?? 0;
                  return (
                    <Link
                      key={ev.id}
                      href={`/eventos/${ev.id}`}
                      className="group relative shrink-0 cursor-pointer"
                      onMouseEnter={(e) => {
                        ensureVisibleOnHover(e);
                        setCurrentEventId(ev.id);
                        setHoveredId(ev.id);
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 text-xl opacity-100 group-hover:opacity-0 transition-opacity duration-700 select-none pointer-events-none">
                        📌
                      </div>
                      <div
                        className={`bg-[#f5f5f3] shadow-[0_18px_35px_rgba(0,0,0,100)] transition-all duration-700 ease-out origin-bottom ${rotate}
                          group-hover:rotate-0 group-hover:z-20 group-hover:relative group-hover:w-185
                          ${ev.destaque
                            ? "w-62.5 md:w-80 p-4 pb-5"
                            : "w-48.75 md:w-65.25 p-3 pb-3"
                          }`}
                      >
                        <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-125 group-hover:opacity-100 group-hover:mb-3 transition-all duration-700 ease-out">
                          <div className="relative w-full aspect-video bg-black overflow-hidden">
                        {ev.fotos.map((foto, i) => (
                          <div
                            key={i}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                              i === idx ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ backgroundImage: `url('/eventos/${ev.pasta}/${foto}')` }}
                          />
                        ))}
                            {ev.fotos.length > 1 && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {ev.fotos.map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                      i === idx ? "bg-orange-500" : "bg-white/50"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-full bg-cover bg-center transition-all duration-700 ease-out ${
                            ev.destaque ? "h-72.5 md:h-88.75" : "h-53.75 md:h-75.5"
                          } group-hover:h-0 group-hover:opacity-0`}
                          style={{ backgroundImage: `url('/eventos/${ev.pasta}/${ev.fotos[0]}')` }}
                        />
                        <div
                          className={`flex items-center mt-2 px-1 transition-all duration-700 ease-out justify-center group-hover:justify-between ${
                            ev.destaque ? "text-base md:text-lg" : "text-[10px] md:text-xs"
                          } group-hover:text-lg md:group-hover:text-xl`}
                        >
                          <span className="font-bold text-black/85 leading-tight">{ev.titulo}</span>
                          <span className="hidden group-hover:inline text-black/70 font-semibold text-base md:text-lg whitespace-nowrap ml-2">
                            {formatarDataCompleta(ev.data)}
                          </span>
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
                    ref={(el) => { monthRefs.current[ev.id] = el; }}
                    className={`text-center shrink-0 ${ev.destaque ? "w-52.5 md:w-60" : "w-18.75 md:w-21.25"} text-sm md:text-md uppercase tracking-wide transition-colors duration-300 ${
                      ev.id === currentEventId ? "text-orange-500" : "text-white/70"
                    }`}
                  >
                    {mesDe(ev.data)}
                  </div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="opacity-0 pointer-events-none text-base md:text-lg font-bold border-t border-transparent pt-2 w-full text-center"
              >
                {ano}
              </div>
            </div>
          ))}
          <div className="absolute bottom-13 left-0 right-0 border-t border-orange-500/30 pointer-events-none" />
        </div>

      </div>
      <div className="text-center mt-0">
        <span className="text-white/90 absolute bottom-4 left-[48.9%] font-bold text-base md:text-lg tracking-wide">
          {currentYear}
        </span>
      </div>
    </div>
  );
}