"use client";
import Image from "next/image";
import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface EventoLightboxProps {
  fotos: string[];
  index: number;
  titulo: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ArrowPos {
  prevLeft: number;
  nextRight: number;
}

interface Point {
  x: number;
  y: number;
}

const ARROW_CLEARANCE = 56;
const SWIPE_THRESHOLD = 50;
const MAX_SCALE = 4;
const DRAG_THRESHOLD = 8;
const WHEEL_DELTA_THRESHOLD = 20;
const WHEEL_COOLDOWN_MS = 500;

export default function EventoLightbox({ fotos, index, titulo, onClose, onIndexChange }: EventoLightboxProps) {
  const total = fotos.length;
  const boxRef = useRef<HTMLDivElement>(null);
  const naturalRef = useRef<{ w: number; h: number } | null>(null);
  const lastWheelNavRef = useRef(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [arrowPos, setArrowPos] = useState<ArrowPos | null>(null);
  const [prevIndex, setPrevIndex] = useState(index);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    setClosing(true);
  }, []);

  // Só desmonta de facto quando a animação de saída (fade-out) termina de
  // verdade, em vez de um timeout com a duração "adivinhada" — assim fica
  // sempre em sincronia com a duration da classe CSS.
  const handleAnimationEnd = () => {
    if (closing) onClose();
  };

  const pinchRef = useRef<{ startDist: number; startScale: number; startTranslate: Point } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startTranslate: Point } | null>(null);
  const touchSwipeStartRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  if (index !== prevIndex) {
    setPrevIndex(index);
    setRect(null);
    setArrowPos(null);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

  const clampTranslate = (t: Point, s: number): Point => {
    const box = boxRef.current;
    if (!box || s <= 1) return { x: 0, y: 0 };
    const maxX = (box.clientWidth * (s - 1)) / 2;
    const maxY = (box.clientHeight * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, t.x)),
      y: Math.min(maxY, Math.max(-maxY, t.y)),
    };
  };

  // Fits the natural image aspect ratio inside the box, so the overlay
  // (close button, arrows, click-to-close area) tracks the actual visible
  // photo edges instead of the (often letterboxed) container box. Only
  // computed once the real dimensions are known, so nothing has to jump
  // from a placeholder position once the image loads.
  const recompute = useCallback(() => {
    const box = boxRef.current;
    const nat = naturalRef.current;
    if (!box || !nat) return;
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    const boxRatio = bw / bh;
    const imgRatio = nat.w / nat.h;
    let width: number, height: number;
    if (imgRatio > boxRatio) {
      width = bw;
      height = bw / imgRatio;
    } else {
      height = bh;
      width = bh * imgRatio;
    }
    const left = (bw - width) / 2;
    setRect({ width, height, left, top: (bh - height) / 2 });
    setArrowPos({
      prevLeft: Math.max(left - ARROW_CLEARANCE, 8),
      nextRight: Math.max(bw - (left + width) - ARROW_CLEARANCE, 8),
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [requestClose, goPrev, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      pinchRef.current = {
        startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        startScale: scale,
        startTranslate: translate,
      };
      touchSwipeStartRef.current = null;
    } else if (e.touches.length === 1) {
      if (scale > 1.01) {
        panRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startTranslate: translate };
      } else {
        touchSwipeStartRef.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const nextScale = Math.min(MAX_SCALE, Math.max(1, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      setScale(nextScale);
      setTranslate(clampTranslate(pinchRef.current.startTranslate, nextScale));
    } else if (e.touches.length === 1 && panRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panRef.current.startX;
      const dy = e.touches[0].clientY - panRef.current.startY;
      setTranslate(clampTranslate({ x: panRef.current.startTranslate.x + dx, y: panRef.current.startTranslate.y + dy }, scale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current) {
      pinchRef.current = null;
      if (scale < 1.05) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
      return;
    }
    if (panRef.current) {
      panRef.current = null;
      return;
    }
    const startX = touchSwipeStartRef.current;
    touchSwipeStartRef.current = null;
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const handleBoxPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    e.preventDefault();
    mouseStartXRef.current = e.clientX;
    draggedRef.current = false;
  };

  const handleBoxPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mouseStartXRef.current === null) return;
    if (Math.abs(e.clientX - mouseStartXRef.current) > DRAG_THRESHOLD) draggedRef.current = true;
  };

  const handleBoxPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const startX = mouseStartXRef.current;
    mouseStartXRef.current = null;
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const handleBoxClick = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  // Swipe de trackpad (dois dedos), mesma abordagem do EventoPageClient.tsx.
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaX) < WHEEL_DELTA_THRESHOLD) return;
    const now = Date.now();
    if (now - lastWheelNavRef.current < WHEEL_COOLDOWN_MS) return;
    lastWheelNavRef.current = now;
    if (e.deltaX > 0) goNext();
    else goPrev();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center ${
        closing ? "animate-out fade-out fill-mode-forwards duration-300" : "animate-in fade-in duration-300"
      }`}
      onClick={requestClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        ref={boxRef}
        className="relative w-[85vw] h-[70vh] md:w-[75vw] md:h-[80vh] cursor-grab active:cursor-grabbing"
        onClick={handleBoxClick}
        onPointerDown={handleBoxPointerDown}
        onPointerMove={handleBoxPointerMove}
        onPointerUp={handleBoxPointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* overflow-hidden isolado aqui (e não no boxRef) para não cortar o
            botão de fechar, que é propositadamente posicionado fora dos
            limites da foto letterboxed */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={fotos[index]}
            alt={`${titulo} - foto ${index + 1}`}
            fill
            draggable={false}
            sizes="90vw"
            className="object-contain touch-none"
            style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
            priority
            onLoad={(e) => {
              const img = e.currentTarget;
              naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
              recompute();
            }}
          />
        </div>

        {/* Pré-carrega a foto anterior/seguinte (invisível, 1x1) para que o
            avançar/recuar no lightbox use o cache do browser em vez de
            arrancar o pedido de rede só no momento do clique. */}
        {total > 1 && (
          <div className="absolute w-px h-px opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <Image src={fotos[(index - 1 + total) % total]} alt="" fill sizes="90vw" loading="eager" />
            <Image src={fotos[(index + 1) % total]} alt="" fill sizes="90vw" loading="eager" />
          </div>
        )}

        {total > 1 && arrowPos && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Foto anterior"
              style={{ left: arrowPos.prevLeft }}
              className="absolute top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all glow-primary cursor-pointer"
            >
              <ChevronLeft size={40} strokeWidth={2.5} className="md:w-14 md:h-14" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Foto seguinte"
              style={{ right: arrowPos.nextRight }}
              className="absolute top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all glow-primary cursor-pointer"
            >
              <ChevronRight size={40} strokeWidth={2.5} className="md:w-14 md:h-14" />
            </button>
          </>
        )}

        {rect && (
          <div
            className="absolute"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={requestClose}
              aria-label="Fechar"
              className="absolute -top-4 -right-4 md:-top-5 md:-right-5 z-10 flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/80 border border-white/20 text-white/90 hover:text-orange-500 hover:border-orange-500 transition-all cursor-pointer"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {total > 1 && (
              <div className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold tracking-wide">
                {index + 1} / {total}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
