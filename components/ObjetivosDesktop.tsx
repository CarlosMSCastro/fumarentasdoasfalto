"use client";
import Image from "next/image";
import { scrollToContactosBypassingSnap } from "@/lib/scroll";
import type { ObjetivoCardId } from "@/lib/objetivos";

const CARDS: { id: ObjetivoCardId; title: string; sub: string; href: string; bgPadrao: string }[] = [
  { id: "encontros", title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bgPadrao: "/conviv.jpg" },
  { id: "restauracao", title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/reparacao", bgPadrao: "/05.jpg" },
  { id: "workshops", title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bgPadrao: "/worksh.jpg" },
];

export default function ObjetivosDesktop({ fotos }: { fotos: Partial<Record<ObjetivoCardId, string>> }) {
  const handleClick = (e: React.MouseEvent, href: string) => {
    if (href === "/reparacao") {
      e.preventDefault();
      scrollToContactosBypassingSnap();
    }
  };
  return (
    <div className="hidden md:flex md:flex-row gap-3 w-full px-[8%] lg:px-[13%]">
      {CARDS.map((item) => (
      <a
      key={item.id}
        href={item.href}
        onClick={(e) => handleClick(e, item.href)}
        className="group relative rounded-sm overflow-hidden flex-1 md:hover:flex-2 opacity-99 transition-all duration-500 h-[60vh] md:h-[45vh] flex flex-col justify-between p-6 shadow-[0_25px_60px_rgba(0,0,0,1)]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={fotos[item.id] ?? item.bgPadrao}
            alt=""
            fill
            sizes="(max-width: 1024px) 33vw, 25vw"
            className="object-cover brightness-[0.70] group-hover:brightness-60 group-hover:scale-150 transition-all duration-500"
          />
        </div>
        <h3 className="relative z-10 text-xl md:text-4xl font-bold text-[#f8f0d9] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] group-hover:text-orange-500 group-hover:text-4xl md:group-hover:text-4xl transition-all duration-300">{item.title}</h3>
        <div className="relative z-10 self-end bg-white/40 group-hover:bg-orange-500 text-white font-bold px-4 py-3 rounded-full transition-all duration-500">
          →
        </div>
      </a>
      ))}
    </div>
  );
}