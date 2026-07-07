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
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);

  const goTo = (next: number, dir: "left" | "right") => {
    setSliding(dir);
    setTimeout(() => {
      setActive(next);
      setSliding(null);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && active < cards.length - 1) goTo(active + 1, "left");
    if (diff < -50 && active > 0) goTo(active - 1, "right");
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 md:hidden px-6">
      <a
        href={cards[active].href}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[50vh] rounded-sm overflow-hidden flex flex-col justify-between p-6"
        style={{
          transition: "transform 0.3s ease, opacity 0.3s ease",
          transform: sliding === "left" ? "translateX(-40px)" : sliding === "right" ? "translateX(40px)" : "translateX(0)",
          opacity: sliding ? 0 : 1,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.65]"
          style={{ backgroundImage: `url('${cards[active].bg}')` }}
        />
        <h3 className="relative z-10 text-5xl font-bold text-white">{cards[active].title}</h3>
        <div className="relative z-10 self-end bg-orange-500 text-white font-bold px-5 py-4 rounded-full text-lg">
          →
        </div>
      </a>
      <div className="flex gap-3">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > active ? "left" : "right")}
            className={`h-3 rounded-full transition-all duration-300 ${i === active ? "bg-orange-500 w-6" : "bg-white/40 w-3"}`}
          />
        ))}
      </div>
    </div>
  );
}