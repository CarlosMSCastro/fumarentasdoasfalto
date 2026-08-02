"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import EventoConteudo from "@/components/EventoConteudo";
import type { Evento } from "@/lib/eventos";

const emptySubscribe = () => () => {};
// Deteta se já estamos no cliente sem o anti-padrão de dar setState dentro
// de um useEffect — getServerSnapshot devolve false na SSR/primeiro render,
// getSnapshot devolve true assim que corre no browser.
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function EventoModal({ evento }: { evento: Evento }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const closedRef = useRef(false);
  // Portal direto para o body: foge da árvore do template.tsx (que anima
  // opacidade em cada navegação) para o modal não herdar esse fade lento.
  const mounted = useMounted();

  const requestClose = useCallback(() => {
    setClosing(true);
  }, []);

  // Só volta atrás quando a animação de saída do overlay (o elemento onde
  // este handler está preso) termina de facto — ignora animationend que
  // faz bubble do cartão interno, senão router.back() dispara duas vezes.
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    if (closing && !closedRef.current) {
      closedRef.current = true;
      router.back();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [requestClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm flex items-start justify-center px-4 md:px-10 pt-6 md:pt-10 pb-4 md:pb-10 ${
        closing ? "animate-out fade-out fill-mode-forwards duration-200" : "animate-in fade-in duration-200"
      }`}
      onClick={requestClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl md:max-w-2xl [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:max-w-[62vh] ${
          closing ? "animate-out zoom-out-95 fade-out fill-mode-forwards duration-200" : "animate-in zoom-in-95 fade-in duration-200"
        }`}
      >
        <button
          onClick={requestClose}
          aria-label="Fechar"
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white/90 hover:text-orange-500 hover:border-orange-500 transition-all cursor-pointer"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="max-h-[92dvh] overflow-y-auto scrollbar-hide rounded-sm">
          <EventoConteudo evento={evento} />
        </div>
      </div>
    </div>,
    document.body
  );
}
