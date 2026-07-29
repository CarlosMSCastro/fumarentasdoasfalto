"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ContactosSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import EventoLightbox from "@/components/EventoLightbox";
import { formatarDataCompleta, type Evento } from "@/lib/eventos";

const EDGE_BOUNCE_PX = 14;
const WHEEL_DELTA_THRESHOLD = 20;
const WHEEL_COOLDOWN_MS = 500;

export default function EventoPageClient({ evento }: { evento: Evento | undefined }) {
  const router = useRouter();
  const [backClicked, setBackClicked] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoStart, setPhotoStart] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const [isDesktop, setIsDesktop] = useState(false);
  const [navDirection, setNavDirection] = useState<"next" | "prev">("next");
  const [edgeBounce, setEdgeBounce] = useState(0);
  const lastWheelNavRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});

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
    const update = () => {
      setIsDesktop(mql.matches);
      setItemsPerPage(mql.matches ? 3 : 4);
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // O onWheel do React regista o listener como passivo, o que torna
  // preventDefault() ineficaz e deixa o gesto de trackpad acionar a
  // navegação nativa (voltar página) do browser. Um listener nativo com
  // passive:false é a única forma de o suprimir de facto.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const listener = (e: WheelEvent) => wheelHandlerRef.current(e);
    el.addEventListener("wheel", listener, { passive: false });
    return () => el.removeEventListener("wheel", listener);
  }, []);

  const totalFotos = evento?.fotos.length ?? 0;
  const visiveis = evento ? evento.fotos.slice(photoStart, photoStart + itemsPerPage) : [];
  const podeRecuar = photoStart > 0;
  const podeAvancar = photoStart + itemsPerPage < totalFotos;
  // Mobile pagina página-a-página (não repete fotos já vistas no último
  // grupo, mesmo que fique incompleto); desktop desliza 1 foto de cada vez.
  const step = isDesktop ? 1 : itemsPerPage;

  // Pequeno "empurrão e volta" na direção tentada, para indicar visualmente
  // que não há mais fotos nesse sentido (em vez de não acontecer nada).
  const triggerEdgeBounce = (direction: 1 | -1) => {
    setEdgeBounce(direction * EDGE_BOUNCE_PX);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEdgeBounce(0));
    });
  };

  const avancar = () => {
    if (podeAvancar) {
      setNavDirection("next");
      setPhotoStart((s) => s + step);
    } else {
      triggerEdgeBounce(1);
    }
  };

  const recuar = () => {
    if (podeRecuar) {
      setNavDirection("prev");
      setPhotoStart((s) => Math.max(0, s - step));
    } else {
      triggerEdgeBounce(-1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX < 0) avancar();
    else recuar();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    e.preventDefault();
    mouseStartX.current = e.clientX;
    draggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mouseStartX.current === null) return;
    if (Math.abs(e.clientX - mouseStartX.current) > 8) draggedRef.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const startX = mouseStartX.current;
    mouseStartX.current = null;
    if (startX === null) return;
    const deltaX = e.clientX - startX;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX < 0) avancar();
    else recuar();
  };

  // Swipe de trackpad (dois dedos): só reage quando deltaX domina sobre
  // deltaY (gesto horizontal intencional) e ignora pinch-zoom (ctrlKey).
  // Cooldown por timestamp em vez de setTimeout — um gesto contínuo dispara
  // muitos eventos wheel, e só queremos navegar uma vez por gesto.
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    // Sem isto, o browser interpreta o deltaX como gesto de navegação
    // (voltar/avançar página) em vez de o reservar para o carrossel.
    e.preventDefault();
    if (Math.abs(e.deltaX) < WHEEL_DELTA_THRESHOLD) return;
    const now = Date.now();
    if (now - lastWheelNavRef.current < WHEEL_COOLDOWN_MS) return;
    lastWheelNavRef.current = now;
    if (e.deltaX > 0) avancar();
    else recuar();
  };

  // Mantém o listener nativo sempre a chamar a versão mais recente do
  // handler (fecha sobre podeAvancar/podeRecuar/step atuais), sem recriar
  // o addEventListener a cada render.
  useEffect(() => {
    wheelHandlerRef.current = handleWheel;
  });

  // Acende a laranja rapidamente antes de voltar, em vez de navegar logo.
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setBackClicked(true);
    setTimeout(() => router.push("/eventos"), 200);
  };

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

  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative h-dvh w-full overflow-hidden snap-start">
        <video
          ref={normalRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
          style={{ opacity: showNormal ? 1 : 0 }}
          src="/videos/drone.mp4"
          poster="/videos/drone-poster.jpg"
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
          poster="/videos/drone-reverso-poster.jpg"
          muted
          playsInline
          onEnded={handleReversoEnded}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/15 to-black/60" />
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/15 to-black/90" />

        <div className="flex h-full flex-col">
          <div className="relative z-0 w-full opacity-95 flex-1 min-h-0 flex flex-col justify-start pb-[clamp(4rem,6dvh,8rem)] md:pb-[clamp(6rem,7dvh,9dvh)] pt-40 md:pt-[clamp(7.5rem,7dvh,10rem)]">
            <div className="px-[8%] md:px-[13%] shrink-0">
              <Link
                href="/eventos"
                onClick={handleBackClick}
                className={`inline-flex items-center md:pt-20 gap-2 self-start transition-colors text-xs md:text-sm font-semibold uppercase tracking-widest mb-1 md:mb-3 ${
                  backClicked ? "text-orange-500" : "text-white/90 hover:text-orange-500"
                }`}
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

            <div
              ref={carouselRef}
              className="relative flex-1 min-h-52 md:min-h-44 max-h-104 md:max-h-136 [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:max-h-152 overscroll-x-none flex items-center cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <button
                onClick={recuar}
                aria-label="Fotos anteriores"
                className={`absolute -left-[2%] md:left-[9%] top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)] ${podeRecuar ? "" : "opacity-40"}`}
              >
                <ChevronLeft size={68} strokeWidth={2} className="md:w-16 md:h-16 animate-bounce-x-left" />
              </button>

              <div
                className="w-full h-full"
                style={{ transform: `translateX(${edgeBounce}px)`, transition: "transform 150ms ease-out" }}
              >
                <div
                  key={isDesktop ? `page-${photoStart}` : "mobile-grid"}
                  className={`w-full h-full grid gap-2 md:gap-3 px-[5%] md:px-[13%] ${
                    isDesktop
                      ? `animate-in fade-in zoom-in-90 ${navDirection === "next" ? "slide-in-from-right-8" : "slide-in-from-left-8"} duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]`
                      : ""
                  }`}
                  style={
                    isDesktop
                      ? { gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))` }
                      : visiveis.length <= 2
                        ? { gridTemplateColumns: `repeat(${Math.max(visiveis.length, 1)}, minmax(0, 1fr))`, gridTemplateRows: "repeat(1, minmax(0, 1fr))" }
                        : { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: "repeat(2, minmax(0, 1fr))" }
                  }
                >
                  {visiveis.map((foto, i) => {
                    const realIndex = photoStart + i;
                    return (
                      <button
                        key={foto}
                        onClick={() => {
                          if (draggedRef.current) return;
                          setLightboxIndex(realIndex);
                        }}
                        aria-label={`Ver foto ${realIndex + 1} em tamanho grande`}
                        className="relative h-full w-full rounded-lg cursor-pointer shadow-[0_15px_30px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:scale-105 hover:z-10"
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-lg">
                          <Image
                            src={`/eventos/${evento.pasta}/${foto}`}
                            alt={`${evento.titulo} - foto ${realIndex + 1}`}
                            fill
                            draggable={false}
                            sizes="(max-width: 768px) 45vw, 27vw"
                            className="object-cover"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={avancar}
                aria-label="Fotos seguintes"
                className={`absolute -right-[2%] md:right-[9%] top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)] ${podeAvancar ? "" : "opacity-40"}`}
              >
                <ChevronRight size={68} strokeWidth={2} className="md:w-16 md:h-16 animate-bounce-x-right" />
              </button>
            </div>

            <div className="flex justify-center items-center gap-1.5 mt-1 md:mt-3 shrink-0">
              {evento.fotos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i >= photoStart && i < photoStart + itemsPerPage ? "bg-orange-500" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" compact />
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
