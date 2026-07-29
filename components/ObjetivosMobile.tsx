"use client";
import Image from "next/image";
import { useState } from "react";
import { scrollToContactosBypassingSnap } from "@/lib/scroll";

const cards = [
  { title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bg: "/conviv.jpg" },
  { title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/reparacao", bg: "/mecanica.jpg" },
  { title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bg: "/worksh.jpg" },
];

export default function ObjetivosMobile() {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);

  const goTo = (next: number, dir: "left" | "right") => {
    setSliding(dir);
    setTimeout(() => {
      setActive(next);
      setSliding(null);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && active < cards.length - 1) goTo(active + 1, "left");
    if (diff < -50 && active > 0) goTo(active - 1, "right");
  };

  const handleClick = (e: React.MouseEvent, href: string) => {
    if (href === "/reparacao") {
      e.preventDefault();
      scrollToContactosBypassingSnap();
    }
  };

  return (
    <div className="w-full flex flex-col items-center md:hidden px-8" style={{ touchAction: 'pan-x' }}>
      {/* wrapper com o tamanho visual do card; os dots ficam aqui fora do
          <a> animado para não sofrerem o slide/fade da troca de card */}
      <div className="relative w-full h-[43vh] max-h-94.5">
        <a
          href={cards[active].href}
          onClick={(e) => handleClick(e, cards[active].href)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 rounded-sm overflow-hidden flex flex-col justify-between p-6 shadow-[0_25px_50px_rgba(0,0,0,0.75)]"
          style={{
            touchAction: 'pan-x',
            transition: "transform 0.3s ease, opacity 0.3s ease",
            transform: sliding === "left" ? "translateX(-40px)" : sliding === "right" ? "translateX(40px)" : "translateX(0)",
            opacity: sliding ? 0 : 1,
          }}
        >
          <Image
            src={cards[active].bg}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-95 brightness-[0.75]"
          />
          <h3 className="relative z-10 text-5xl font-bold text-white">{cards[active].title}</h3>
          <div className="relative z-10 self-end bg-orange-500 text-white font-bold px-5 py-4 rounded-full text-lg">
            →
          </div>
        </a>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > active ? "left" : "right")}
              className={`h-3 rounded-full transition-all duration-300 ${i === active ? "bg-orange-500 w-6" : "bg-white/40 w-3"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}