"use client";
import { useState } from "react";

const cards = [
  { title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bg: "/conviv.jpg" },
  { title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/contacto", bg: "/mecanica.jpg" },
  { title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bg: "/worksh.jpg" },
];

export default function ObjetivosMobile() {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && active < cards.length - 1) setActive(active + 1);
    if (diff < -50 && active > 0) setActive(active - 1);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 md:hidden px-4">
      <a
        href={cards[active].href}
        className="relative w-full h-[55vh] rounded-sm overflow-hidden flex flex-col justify-between p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.55]"
          style={{ backgroundImage: `url('${cards[active].bg}')` }}
        />
        <h3 className="relative z-10 text-2xl font-bold text-white">{cards[active].title}</h3>
        <div className="relative z-10 self-end bg-orange-500 text-white font-bold px-3 py-2 rounded-full text-sm">
          →
        </div>
      </a>
      <div className="flex gap-3">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-3 rounded-full transition-all duration-300 ${i === active ? "bg-orange-500 w-6" : "bg-white/40 w-3"}`}
          />
        ))}
      </div>
    </div>
  );
}