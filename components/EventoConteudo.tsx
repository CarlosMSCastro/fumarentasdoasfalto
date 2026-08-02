"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventoLightbox from "@/components/EventoLightbox";
import { formatarDataCompleta, type Evento } from "@/lib/eventos";

export default function EventoConteudo({ evento }: { evento: Evento }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroFoto = evento.fotos[heroIndex];
  const filmstripRef = useRef<HTMLDivElement>(null);

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
    <div className="max-w-xl mx-auto rounded-sm bg-[#f8f0d9] shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-3 md:p-5">
      <button
        onClick={() => setLightboxIndex(heroIndex)}
        aria-label={`Ver foto ${heroIndex + 1} em tamanho grande`}
        className="relative block w-full aspect-square overflow-hidden rounded-sm cursor-pointer"
      >
        <Image
          src={`/eventos/${evento.pasta}/${heroFoto}`}
          alt={`${evento.titulo} - foto ${heroIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 90vw, 42rem"
          className="object-cover"
        />
      </button>

      {evento.fotos.length > 1 && (
        <div className="relative mt-2 md:mt-3">
          <div
            ref={filmstripRef}
            onWheel={handleFilmstripWheel}
            className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide p-1 -m-1"
          >
            {evento.fotos.map((foto, i) => (
              <button
                key={foto}
                onClick={() => setHeroIndex(i)}
                aria-label={`Mostrar foto ${i + 1}`}
                className={`relative shrink-0 w-14 h-14 md:w-20 md:h-20 overflow-hidden rounded-sm cursor-pointer ring-2 transition-all ${
                  i === heroIndex ? "ring-orange-500" : "ring-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={`/eventos/${evento.pasta}/${foto}`} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip(-1)}
            aria-label="Fotos anteriores"
            className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white shadow-md cursor-pointer hover:bg-black/85 transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => scrollFilmstrip(1)}
            aria-label="Fotos seguintes"
            className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white shadow-md cursor-pointer hover:bg-black/85 transition-colors"
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
          pasta={evento.pasta}
          fotos={evento.fotos}
          index={lightboxIndex}
          titulo={evento.titulo}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(i) => {
            setLightboxIndex(i);
            setHeroIndex(i);
          }}
        />
      )}
    </div>
  );
}
