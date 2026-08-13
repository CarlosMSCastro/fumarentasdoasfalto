"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventoLightbox from "@/components/EventoLightbox";
import { formatarDataCompleta } from "@/lib/eventos-formato";
import type { Evento } from "@/lib/eventos";

export default function EventoConteudo({ evento }: { evento: Evento }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const heroScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (heroScrollTimeoutRef.current) clearTimeout(heroScrollTimeoutRef.current);
    };
  }, []);

  // A foto principal é um carrossel de scroll nativo com snap (touch,
  // trackpad e arrasto com rato funcionam todos "de borla"), em vez de
  // simulado via handlers de touch/wheel — importante no Safari/macOS: só um
  // scroll nativo real faz o browser suprimir o gesto de "voltar página" ao
  // fazer swipe lateral com o trackpad. O overscroll-behavior-x global (ver
  // globals.css) sozinho não é suficiente, o Safari não o respeita bem para
  // esse gesto — só para scroll chaining entre containers reais, daí a tira
  // de miniaturas abaixo (que já é overflow-x-auto real) nunca ter tido este
  // problema.
  const handleHeroScroll = () => {
    const el = heroScrollRef.current;
    if (!el) return;
    if (heroScrollTimeoutRef.current) clearTimeout(heroScrollTimeoutRef.current);
    heroScrollTimeoutRef.current = setTimeout(() => {
      const index = Math.max(0, Math.min(Math.round(el.scrollLeft / el.clientWidth), evento.fotos.length - 1));
      setHeroIndex(index);
      // O snap nativo por vezes não "fecha" sozinho num swipe de trackpad
      // mais fraco (fica a meio caminho) — força o alinhamento exato ao
      // índice mais próximo assim que o scroll estabiliza.
      const target = index * el.clientWidth;
      if (Math.abs(el.scrollLeft - target) > 1) {
        el.scrollTo({ left: target, behavior: "smooth" });
      }
    }, 80);
  };

  const scrollHeroTo = (index: number) => {
    setHeroIndex(index);
    heroScrollRef.current?.scrollTo({ left: index * heroScrollRef.current.clientWidth, behavior: "smooth" });
  };

  // Roda do rato normal só manda scroll vertical — converte para horizontal
  // nesta tira, senão não há forma de a deslizar com um rato normal.
  const handleFilmstripWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = filmstripRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };

  const scrollFilmstrip = (direction: 1 | -1) => {
    filmstripRef.current?.scrollBy({ left: direction * 200, behavior: "smooth" });
  };

  return (
    <div className="rounded-sm bg-[#f8f0d9] shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-3 md:p-5">
      <div
        ref={heroScrollRef}
        onScroll={handleHeroScroll}
        className="relative flex w-full aspect-square overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain rounded-sm"
      >
        {evento.fotos.map((foto, i) => (
          <button
            key={foto}
            onClick={() => setLightboxIndex(i)}
            aria-label={`Ver foto ${i + 1} em tamanho grande`}
            className="relative shrink-0 w-full h-full snap-start overflow-hidden cursor-pointer"
          >
            <Image
              src={foto}
              alt={`${evento.titulo} - foto ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 90vw, 42rem"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {evento.fotos.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2 md:mt-3">
          <button
            onClick={() => scrollFilmstrip(-1)}
            aria-label="Fotos anteriores"
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white shadow-md cursor-pointer hover:bg-black/85 transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <div
            ref={filmstripRef}
            onWheel={handleFilmstripWheel}
            className="flex-1 min-w-0 flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide p-1 -m-1"
          >
            {evento.fotos.map((foto, i) => (
              <button
                key={foto}
                onClick={() => scrollHeroTo(i)}
                aria-label={`Mostrar foto ${i + 1}`}
                className={`relative shrink-0 w-14 h-14 md:w-20 md:h-20 overflow-hidden rounded-sm cursor-pointer ring-2 transition-all ${
                  i === heroIndex ? "ring-orange-500" : "ring-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={foto} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip(1)}
            aria-label="Fotos seguintes"
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white shadow-md cursor-pointer hover:bg-black/85 transition-colors"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 md:mt-3 px-1 gap-2">
        <span className="font-bold text-black/85 leading-tight text-base md:text-2xl">{evento.titulo}</span>
        <span className="text-black/70 font-semibold text-sm md:text-lg whitespace-nowrap">{formatarDataCompleta(evento.data)}</span>
      </div>
      <p className="text-black/70 text-xs md:text-base px-1 mt-0.5">{evento.local}</p>
      {evento.descricao && <p className="text-black/70 text-xs md:text-sm px-1 mt-2">{evento.descricao}</p>}

      {lightboxIndex !== null && (
        <EventoLightbox
          fotos={evento.fotos}
          index={lightboxIndex}
          titulo={evento.titulo}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(i) => {
            setLightboxIndex(i);
            setHeroIndex(i);
            // Instantâneo (sem "behavior: smooth") — a lightbox está aberta
            // por cima, não faz sentido animar o carrossel por baixo.
            const el = heroScrollRef.current;
            if (el) el.scrollLeft = i * el.clientWidth;
          }}
        />
      )}
    </div>
  );
}
