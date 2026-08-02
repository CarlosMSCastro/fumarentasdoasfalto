"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { getEventos, mesDe, formatarDataCompleta, type Evento } from "@/lib/eventos";
const eventos = getEventos();
function agruparPorAno(lista: Evento[]) {
  const grupos: Record<string, Evento[]> = {};
  lista.forEach((ev) => {
    const ano = ev.data.split("-")[0];
    if (!grupos[ano]) grupos[ano] = [];
    grupos[ano].push(ev);
  });
  return grupos;
}
const DRAG_THRESHOLD = 6;
const ARROW_SCROLL_SPEED = 420; // px por segundo (independente do refresh rate)
const CARD_SHADOW = "shadow-[0_18px_35px_rgba(0,0,0,100)]";
// Sombreado subtil de cima para baixo, em todos os cartões.
const CARD_BOTTOM_SHADE = "absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.22)_100%)]";
// "Dog-ear": um pequeno triângulo real recortado (clip-path) num canto,
// metade clara/metade escura — simula um canto de papel dobrado a sério,
// com arestas nítidas em vez de um gradiente desfocado. Só 1 em cada 4
// cartões tem, e o canto varia entre eles — ambos por idHash
// (determinístico, não muda entre renders).
const CARD_DOG_EARS = [
  "absolute w-7 h-7 top-0 left-0 [clip-path:polygon(0_0,100%_0,0_100%)] bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.4),rgba(0,0,0,0.28))]",
  "absolute w-7 h-7 top-0 right-0 [clip-path:polygon(100%_0,100%_100%,0_0)] bg-[linear-gradient(to_bottom_left,rgba(255,255,255,0.4),rgba(0,0,0,0.28))]",
  "absolute w-7 h-7 bottom-0 left-0 [clip-path:polygon(0_100%,0_0,100%_100%)] bg-[linear-gradient(to_top_right,rgba(255,255,255,0.4),rgba(0,0,0,0.28))]",
  "absolute w-7 h-7 bottom-0 right-0 [clip-path:polygon(100%_100%,0_100%,100%_0)] bg-[linear-gradient(to_top_left,rgba(255,255,255,0.4),rgba(0,0,0,0.28))]",
];
export default function EventosTimeline() {
  const grupos = agruparPorAno(eventos);
  const anos = Object.keys(grupos).sort();
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrowScrollRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(anos[0]);
  const [clickedCardId, setClickedCardId] = useState<string | null>(null);
  const router = useRouter();
  let globalIndex = 0;

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
    return () => {
      if (arrowScrollRef.current) cancelAnimationFrame(arrowScrollRef.current);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // Scroll contínuo só enquanto o rato está mesmo em cima de uma seta —
  // distinto do auto-scroll por proximidade à margem que foi removido.
  const startArrowScroll = (direction: 1 | -1) => {
    if (arrowScrollRef.current) cancelAnimationFrame(arrowScrollRef.current);
    let lastTime: number | null = null;
    const step = (time: number) => {
      const container = scrollRef.current;
      if (!container) return;
      if (lastTime !== null) {
        const dt = (time - lastTime) / 1000;
        container.scrollLeft += direction * ARROW_SCROLL_SPEED * dt;
      }
      lastTime = time;
      arrowScrollRef.current = requestAnimationFrame(step);
    };
    arrowScrollRef.current = requestAnimationFrame(step);
  };

  const stopArrowScroll = () => {
    if (arrowScrollRef.current) {
      cancelAnimationFrame(arrowScrollRef.current);
      arrowScrollRef.current = null;
    }
  };

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const container = scrollRef.current;
      if (!container) return;
      const dx = e.clientX - dragStartXRef.current;
      if (Math.abs(dx) > DRAG_THRESHOLD) dragMovedRef.current = true;
      container.scrollLeft = dragStartScrollRef.current - dx;
    };
    const handleWindowPointerUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, []);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || e.pointerType !== "mouse" || e.button !== 0) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = container.scrollLeft;
  };

  // Calcula a partir do EVENTO mais próximo do centro (não do grupo de ano
  // inteiro) — grupos de anos com larguras muito diferentes faziam o
  // indicador mostrar um ano que não correspondia ao cartão realmente
  // centrado no ecrã.
  // Só recalcula uma vez por frame (rAF), em vez de a cada evento nativo de
  // scroll (que dispara muitas vezes durante scroll/drag contínuo) — evita
  // repetir a leitura de offsetLeft/offsetWidth de todos os eventos por tick.
  const handleScroll = () => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollRef.current;
      if (!container) return;
      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      let closest = anos[0];
      let closestDist = Infinity;
      eventos.forEach((ev) => {
        const el = monthRefs.current[ev.id];
        if (!el) return;
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(elCenter - containerCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = ev.data.split("-")[0];
        }
      });
      setCurrentYear(closest);
    });
  };


  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, ev: Evento) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      return;
    }
    // No mobile, dá um "pop" rápido no card antes de navegar — no desktop
    // (onde já há o hover-zoom) a navegação mantém-se instantânea.
    if (window.innerWidth >= 768) return;
    e.preventDefault();
    setClickedCardId(ev.id);
    setTimeout(() => router.push(`/eventos/${ev.id}`, { scroll: false }), 150);
  };

  return (
    <div className="relative w-full -mt-6 md:-mt-[150px] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:-mt-2">
      <button
        onPointerEnter={(e) => { if (e.pointerType === "mouse") startArrowScroll(-1); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") stopArrowScroll(); }}
        aria-label="Recuar na timeline"
        className="absolute -left-1 md:left-[-115px] top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all glow-primary cursor-pointer"
      >
        <ChevronLeft strokeWidth={1} className="w-12 h-12 md:w-24 md:h-24 stroke-[2.5] md:stroke-1 animate-bounce-x-left" />
      </button>
      <button
        onPointerEnter={(e) => { if (e.pointerType === "mouse") startArrowScroll(1); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") stopArrowScroll(); }}
        aria-label="Avançar na timeline"
        className="absolute -right-1 md:right-[-115px] top-1/2 -translate-y-1/2 z-40 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all glow-primary cursor-pointer"
      >
        <ChevronRight strokeWidth={1} className="w-12 h-12 md:w-24 md:h-24 stroke-[2.5] md:stroke-1 animate-bounce-x-right" />
      </button>
      <div
        ref={scrollRef}
        onPointerDown={handleDragStart}
        onScroll={handleScroll}
        className="w-full overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab active:cursor-grabbing [--edge-fade:4px] md:[--edge-fade:clamp(24px,8vw,100px)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:pt-[200px] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:-mt-[200px]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0px, black var(--edge-fade), black calc(100% - var(--edge-fade)), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0px, black var(--edge-fade), black calc(100% - var(--edge-fade)), transparent 100%)",
        }}
      >
        <div
          className="relative flex items-end gap-4 md:gap-8 pt-4 md:pt-[146px] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:pt-[70px] pb-4 md:pb-4 w-max mx-auto md:pl-[150px] md:pr-[150px]"
        >
          {anos.map((ano) => (
            <div key={ano} ref={(el) => { yearRefs.current[ano] = el; }} className="flex flex-col items-center shrink-0 min-h-110 [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:min-h-[clamp(2rem,calc(98dvh_-_398px),27.5rem)] justify-end overflow-visible">
              <div className="flex items-end gap-2 md:gap-3 mb-5 [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:mb-4 h-[clamp(14rem,64dvh,27rem)] md:h-[clamp(18rem,calc(98dvh_-_250px),32rem)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:h-[clamp(1rem,calc(98dvh_-_439px),30rem)] z-30">
                {grupos[ano].map((ev) => {
                  const rotate = globalIndex % 2 === 0 ? "-rotate-2" : "rotate-1.5";
                  const hoverRotate = globalIndex % 2 === 0 ? "group-hover:rotate-2" : "group-hover:-rotate-1.5";
                  const idHash = ev.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                  const dogEar = idHash % 4 === 0 ? CARD_DOG_EARS[idHash % CARD_DOG_EARS.length] : null;
                  // Escurecimento por card (só mobile): cards da metade
                  // esquerda da timeline escurecem à esquerda (perto da seta
                  // de recuar), os da direita escurecem à direita — sem
                  // precisar de saber a posição real do scroll.
                  const isLeftHalf = globalIndex < eventos.length / 2;
                  globalIndex++;
                  return (
                    <Link
                      key={ev.id}
                      href={`/eventos/${ev.id}`}
                      scroll={false}
                      className={`group relative shrink-0 cursor-pointer ${
                        ev.destaque ? "w-62.5 md:w-80" : "w-56 md:w-71.25"
                      }`}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "mouse") return;
                        setCurrentEventId(ev.id);
                      }}
                      onClick={(e) => handleCardClick(e, ev)}
                    >
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 bottom-0 rounded-sm bg-[#f8f0d9] ${CARD_SHADOW} transition-all ${clickedCardId === ev.id ? "duration-150 scale-105" : "duration-700"} ease-out origin-bottom ${rotate}
                          ${hoverRotate} group-hover:z-20
                          ${ev.destaque
                            ? "w-62.5 md:w-80 md:group-hover:w-102.5 p-4 pb-8"
                            : "w-56 md:w-71.25 md:group-hover:w-91.5 p-3 pb-6"
                          }`}
                      >
                        <div
                          className={`relative w-full overflow-hidden transition-all duration-700 ease-out ${
                            ev.destaque
                              ? "h-[clamp(9.5rem,48dvh,18.5rem)] md:h-[clamp(14rem,calc(76dvh_-_194px),24.5rem)] md:group-hover:h-[clamp(17.75rem,calc(98dvh_-_255px),31.5rem)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:h-[clamp(0.85rem,calc(98dvh_-_470px),22.5rem)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:group-hover:h-[clamp(15rem,calc(98dvh_-_400px),29rem)]"
                              : "h-[clamp(9rem,50dvh,19rem)] md:h-[clamp(12rem,calc(64dvh_-_160px),21rem)] md:group-hover:h-[clamp(15.25rem,calc(82dvh_-_207px),26.875rem)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:h-[clamp(0.7rem,calc(98dvh_-_520px),19.5rem)] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:group-hover:h-[clamp(12rem,calc(98dvh_-_470px),24.5rem)]"
                          }`}
                        >
                          <Image
                            src={`/eventos/${ev.pasta}/${ev.capa}`}
                            alt={ev.titulo}
                            fill
                            sizes={ev.destaque ? "(max-width: 768px) 250px, 410px" : "(max-width: 768px) 224px, 366px"}
                            className="object-cover"
                          />
                          <div
                            aria-hidden="true"
                            className={`absolute inset-0 z-10 pointer-events-none md:hidden ${
                              isLeftHalf
                                ? "bg-[linear-gradient(to_right,rgba(0,0,0,0.75),transparent_40%)]"
                                : "bg-[linear-gradient(to_left,rgba(0,0,0,0.75),transparent_40%)]"
                            }`}
                          />
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
                        {dogEar && <div aria-hidden="true" className={`${dogEar} pointer-events-none`} />}
                        <div aria-hidden="true" className={CARD_BOTTOM_SHADE} />
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
                    className={`text-center shrink-0 ${ev.destaque ? "w-62.5 md:w-80" : "w-56 md:w-71.25"} text-sm md:text-md uppercase tracking-wide font-semibold transition-colors duration-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
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