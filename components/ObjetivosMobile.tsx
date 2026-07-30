"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { scrollToContactosBypassingSnap } from "@/lib/scroll";

const cards = [
  { title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bg: "/conviv.jpg" },
  { title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/reparacao", bg: "/mecanica.jpg" },
  { title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bg: "/worksh.jpg" },
];

const SWIPE_THRESHOLD = 50;

export default function ObjetivosMobile() {
  const [active, setActive] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  const goTo = (next: number) => {
    setActive(Math.max(0, Math.min(cards.length - 1, next)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start === null) return;
    const diff = start - e.changedTouches[0].clientX;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    goTo(diff > 0 ? active + 1 : active - 1);
  };

  const handleClick = (e: React.MouseEvent, href: string) => {
    if (href === "/reparacao") {
      e.preventDefault();
      scrollToContactosBypassingSnap();
    }
  };

  return (
    <div className="w-full flex flex-col items-center md:hidden px-8" style={{ touchAction: 'pan-x' }}>
      <div className="relative w-full h-[43vh] max-h-94.5 overflow-hidden rounded-sm">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${active * 100}%)`, touchAction: 'pan-x' }}
        >
          {cards.map((card, i) => (
            <a
              key={`${card.href}-${i}`}
              href={card.href}
              onClick={(e) => handleClick(e, card.href)}
              className="relative w-full h-full shrink-0 flex flex-col justify-between p-6 shadow-[0_25px_50px_rgba(0,0,0,0.75)]"
            >
              <Image
                src={card.bg}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-95 brightness-[0.75]"
              />
              <h3 className="relative z-10 text-5xl font-bold text-white">{card.title}</h3>
              <div className="relative z-10 self-end bg-orange-500 text-white font-bold px-5 py-4 rounded-full text-lg">
                →
              </div>
            </a>
          ))}
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-3 rounded-full transition-all duration-300 ${i === active ? "bg-orange-500 w-6" : "bg-white/40 w-3"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
