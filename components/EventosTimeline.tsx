"use client";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import eventosData from "@/data/eventos.json";
interface Evento {
  id: string;
  titulo: string;
  local: string;
  data: string;
  descricao: string;
  destaque: boolean;
  pasta: string;
  capa: string;
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
const HOVER_WIDTH = 680;
const EDGE_BUFFER = 30;
const CAROUSEL_LIMIT = 4;
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
    const total = ev ? Math.min(ev.fotos.length, CAROUSEL_LIMIT) : 0;
    if (!ev || total <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const current = prev[hoveredId] ?? 0;
        const next = (current + 1) % total;
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
    <div className="relative w-full md:-mt-[150px]">
      <button
        className="pointer-events-none absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronLeft strokeWidth={1} className="w-8 h-8 md:w-24 md:h-24 stroke-[2.5] md:stroke-1" />
      </button>
      <button
        className="pointer-events-none absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
      >
        <ChevronRight strokeWidth={1} className="w-8 h-8 md:w-24 md:h-24 stroke-[2.5] md:stroke-1" />
      </button>
      <div
        ref={scrollRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
        className="w-full overflow-x-auto overflow-y-visible scrollbar-hide "
        style={{
          maskImage: "linear-gradient(to right, transparent 0px, black clamp(24px,8vw,100px), black calc(100% - clamp(24px,8vw,100px)), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0px, black clamp(24px,8vw,100px), black calc(100% - clamp(24px,8vw,100px)), transparent 100%)",
        }}
      >
        <div
          className="relative flex items-end gap-4 md:gap-8 pt-14 md:pt-[146px] pb-4 w-max mx-auto pl-2 pr-2 md:pl-[150px] md:pr-[150px]"
        >
          {anos.map((ano) => (
            <div key={ano} ref={(el) => { yearRefs.current[ano] = el; }} className="flex flex-col items-center shrink-0 min-h-110 justify-end overflow-visible">
              <div className="flex items-end gap-2 md:gap-3 mb-5 h-[clamp(13rem,58dvh,24rem)] md:h-[clamp(18rem,calc(98dvh_-_373px),32rem)] z-30">
                {grupos[ano].map((ev) => {
                  const rotate = globalIndex % 2 === 0 ? "-rotate-4" : "rotate-3";
                  const hoverRotate = globalIndex % 2 === 0 ? "group-hover:rotate-4" : "group-hover:-rotate-3";
                  const highSide = globalIndex % 2 === 0 ? "right" : "left";
                  const idHash = ev.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                  const randomFlip = idHash % 4 === 0;
                  const pinOnRight = randomFlip ? highSide === "left" : highSide === "right";
                  const pinSide = pinOnRight ? "left-[78%]" : "left-[22%]";
                  globalIndex++;
                  const idx = carouselIndex[ev.id] ?? 0;
                  return (
                    <Link
                      key={ev.id}
                      href={`/eventos/${ev.id}`}
                      className={`group relative shrink-0 cursor-pointer ${
                        ev.destaque ? "w-62.5 md:w-80" : "w-56 md:w-71.25"
                      }`}
                      onMouseEnter={(e) => {
                        ensureVisibleOnHover(e);
                        setCurrentEventId(ev.id);
                        setHoveredId(ev.id);
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 bottom-0 bg-[#f5f5f3] shadow-[0_18px_35px_rgba(0,0,0,100)] transition-all duration-700 ease-out origin-bottom ${rotate}
                          ${hoverRotate} group-hover:z-20
                          ${ev.destaque
                            ? "w-62.5 md:w-80 md:group-hover:w-102.5 p-4 pb-8"
                            : "w-56 md:w-71.25 md:group-hover:w-91.5 p-3 pb-6"
                          }`}
                      >
                        <div className={`absolute -translate-x-1/2 -top-4.5 z-20 w-9 h-9 opacity-100 group-hover:opacity-0 transition-opacity duration-700 select-none pointer-events-none ${pinSide}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/pin.png"
                            alt=""
                            className={`w-full h-full object-contain ${ev.destaque ? "hue-rotate-[50deg] saturate-150 brightness-110" : ""}`}
                          />
                        </div>
                        <div
                          className={`relative w-full overflow-hidden transition-all duration-700 ease-out ${
                            ev.destaque ? "h-[clamp(9.5rem,48dvh,19rem)] md:h-[clamp(14rem,calc(76dvh_-_288px),24.5rem)] md:group-hover:h-[clamp(17.75rem,calc(98dvh_-_370px),31.5rem)]" : "h-[clamp(8rem,44dvh,17rem)] md:h-[clamp(12rem,calc(64dvh_-_245px),21rem)] md:group-hover:h-[clamp(15.25rem,calc(82dvh_-_315px),26.875rem)]"
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('/eventos/${ev.pasta}/${ev.capa}')` }}
                          />
                          {ev.fotos.slice(0, CAROUSEL_LIMIT).map((foto, i) => (
                            <div
                              key={i}
                              className={`absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-700 ${
                                i === idx ? "md:group-hover:opacity-100" : ""
                              }`}
                              style={{ backgroundImage: `url('/eventos/${ev.pasta}/${foto}')` }}
                            />
                          ))}
                          {Math.min(ev.fotos.length, CAROUSEL_LIMIT) > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 transition-opacity duration-700 md:group-hover:opacity-100">
                              {ev.fotos.slice(0, CAROUSEL_LIMIT).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                    i === idx ? "bg-orange-500" : "bg-white/50"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <span className="flex items-center justify-center w-13 h-13 rounded-full bg-orange-500 text-white shadow-lg">
                              <ArrowUpRight size={28} strokeWidth={2.5} />
                            </span>
                          </div>
                        </div>
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
                    className={`text-center shrink-0 ${ev.destaque ? "w-52.5 md:w-60" : "w-18.75 md:w-21.25"} text-sm md:text-md uppercase tracking-wide font-semibold transition-colors duration-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
                      ev.id === currentEventId ? "text-orange-500" : "text-white/90"
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
        <span className="text-white/90 absolute bottom-4 left-1/2 -translate-x-1/2 font-bold text-base md:text-lg tracking-wide">
          {currentYear}
        </span>
      </div>
    </div>
  );
}