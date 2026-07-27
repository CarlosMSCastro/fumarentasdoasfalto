"use client";
import Image from "next/image";
import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface EventoLightboxProps {
  pasta: string;
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

const ARROW_CLEARANCE = 56;

export default function EventoLightbox({ pasta, fotos, index, titulo, onClose, onIndexChange }: EventoLightboxProps) {
  const total = fotos.length;
  const boxRef = useRef<HTMLDivElement>(null);
  const naturalRef = useRef<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [arrowPos, setArrowPos] = useState<ArrowPos | null>(null);
  const [prevIndex, setPrevIndex] = useState(index);

  if (index !== prevIndex) {
    setPrevIndex(index);
    setRect(null);
    setArrowPos(null);
  }

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

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
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div ref={boxRef} className="relative w-[85vw] h-[70vh] md:w-[75vw] md:h-[80vh]">
        <Image
          src={`/eventos/${pasta}/${fotos[index]}`}
          alt={`${titulo} - foto ${index + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
          onLoad={(e) => {
            const img = e.currentTarget;
            naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
            recompute();
          }}
        />

        {total > 1 && arrowPos && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Foto anterior"
              style={{ left: arrowPos.prevLeft }}
              className="absolute top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
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
              className="absolute top-1/2 -translate-y-1/2 z-10 text-orange-500 hover:text-orange-400 hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]"
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
              onClick={onClose}
              aria-label="Fechar"
              className="absolute -top-4 -right-4 md:-top-5 md:-right-5 z-10 flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/80 border border-white/20 text-white/90 hover:text-orange-500 hover:border-orange-500 transition-all"
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
