"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ContactosSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import EventoLightbox from "@/components/EventoLightbox";
import { getEventoById, formatarDataCompleta } from "@/lib/eventos";

export default function EventoPage() {
  const params = useParams<{ id: string }>();
  const evento = getEventoById(params.id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoStart, setPhotoStart] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(2);

  const [showNormal, setShowNormal] = useState(true);
  const normalRef = useRef<HTMLVideoElement>(null);
  const reversoRef = useRef<HTMLVideoElement>(null);

  const handleNormalEnded = () => {
    setShowNormal(false);
    if (reversoRef.current) reversoRef.current.currentTime = 0;
    reversoRef.current?.play();
  };

  const handleReversoEnded = () => {
    setShowNormal(true);
    if (normalRef.current) normalRef.current.currentTime = 0;
    normalRef.current?.play();
  };

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setItemsPerPage(mql.matches ? 3 : 4);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!evento) {
    return (
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <section className="relative h-dvh w-full flex flex-col items-center justify-center gap-6 snap-start bg-black overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
            src="/videos/smoke.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <p className="relative z-10 text-white/70 text-lg">Evento não encontrado.</p>
          <Link
            href="/eventos"
            className="relative z-10 rounded-full bg-orange-500 px-6 py-3 text-white font-semibold hover:bg-orange-600 transition-all"
          >
            Voltar aos eventos
          </Link>
          <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
        </section>
        <div className="snap-start">
          <ContactosSection />
        </div>
      </div>
    );
  }

  const maxStart = Math.max(0, evento.fotos.length - itemsPerPage);
  const visiveis = evento.fotos.slice(photoStart, photoStart + itemsPerPage);
  const podeRecuar = photoStart > 0;
  const podeAvancar = photoStart < maxStart;

  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative h-dvh w-full overflow-hidden snap-start">
        <video
          ref={normalRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
          style={{ opacity: showNormal ? 1 : 0 }}
          src="/videos/drone.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleNormalEnded}
        />
        <video
          ref={reversoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
          style={{ opacity: showNormal ? 0 : 1 }}
          src="/videos/drone-reverso.mp4"
          muted
          playsInline
          onEnded={handleReversoEnded}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/15 to-black/60" />
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/15 to-black/90" />

        <div className="flex h-full flex-col">
          <div className="relative z-0 w-full opacity-95 flex-1 min-h-0 flex flex-col justify-start pb-[clamp(5.5rem,8dvh,10rem)] md:pb-[clamp(6rem,7dvh,9dvh)] pt-40 md:pt-[clamp(7.5rem,7dvh,10rem)]">
            <div className="px-[8%] md:px-[13%] shrink-0">
              <Link
                href="/eventos"
                className="inline-flex items-center md:pt-20 gap-2 self-start text-white/90 hover:text-orange-500 transition-colors text-xs md:text-sm font-semibold uppercase tracking-widest mb-1 md:mb-3"
              >
                <ArrowLeft size={18} />
                Voltar aos eventos
              </Link>

              <p className="text-orange-500 uppercase tracking-widest text-xs md:text-base font-bold mb-0.5 md:mb-2">
                {evento.local} &middot; {formatarDataCompleta(evento.data)}
              </p>
              <h1 className="text-2xl md:text-5xl font-bold text-white/90 mb-1 md:mb-3 max-w-4xl line-clamp-2">{evento.titulo}</h1>
              <p className="text-white/70 text-xs md:text-lg max-w-3xl mb-1.5 md:mb-6 line-clamp-2 md:line-clamp-3">{evento.descricao}</p>
            </div>

            <div className="relative flex-1 min-h-52 md:min-h-44 max-h-76 md:max-h-68 flex items-center">
              <button
                onClick={() => setPhotoStart((s) => Math.max(0, s - 1))}
                disabled={!podeRecuar}
                aria-label="Fotos anteriores"
                className="absolute left-[3%] md:left-[9%] top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 disabled:opacity-25 disabled:pointer-events-none transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
              >
                <ChevronLeft size={40} strokeWidth={2.5} className="md:w-12 md:h-12" />
              </button>

              <div
                className="w-full h-full grid gap-2 md:gap-3 px-[8%] md:px-[13%]"
                style={
                  itemsPerPage === 4
                    ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: "repeat(2, minmax(0, 1fr))" }
                    : { gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))` }
                }
              >
                {visiveis.map((foto, i) => {
                  const realIndex = photoStart + i;
                  return (
                    <button
                      key={foto}
                      onClick={() => setLightboxIndex(realIndex)}
                      aria-label={`Ver foto ${realIndex + 1} em tamanho grande`}
                      className="relative h-full w-full overflow-hidden rounded-lg group cursor-pointer"
                    >
                      <Image
                        src={`/eventos/${evento.pasta}/${foto}`}
                        alt={`${evento.titulo} - foto ${realIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 45vw, 27vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPhotoStart((s) => Math.min(maxStart, s + 1))}
                disabled={!podeAvancar}
                aria-label="Fotos seguintes"
                className="absolute right-[3%] md:right-[9%] top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 disabled:opacity-25 disabled:pointer-events-none transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
              >
                <ChevronRight size={40} strokeWidth={2.5} className="md:w-12 md:h-12" />
              </button>
            </div>

            <p className="text-center text-white/60 text-xs md:text-sm font-semibold tracking-widest mt-1 md:mt-3 shrink-0">
              {Math.min(photoStart + itemsPerPage, evento.fotos.length)} / {evento.fotos.length}
            </p>
          </div>
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>

      <div className="snap-start">
        <ContactosSection />
      </div>

      {lightboxIndex !== null && (
        <EventoLightbox
          pasta={evento.pasta}
          fotos={evento.fotos}
          index={lightboxIndex}
          titulo={evento.titulo}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
