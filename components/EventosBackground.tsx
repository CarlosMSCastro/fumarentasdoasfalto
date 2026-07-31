"use client";
import Image from "next/image";

// Fundo partilhado entre /eventos e /eventos/[id] — vive no layout desta
// rota (não em cada página), por isso persiste entre navegações client-side
// sem remontar, ficando fixo ao viewport (position: fixed) enquanto o
// conteúdo de cada página muda por cima. Mesmo tratamento de cores/sombras
// do <SobreBackground />. A ContactosSection (usada no fundo de ambas as
// páginas) tem o seu próprio bg-background opaco, o que a faz cobrir por
// completo este fundo fixo assim que entra no ecrã.
export default function EventosBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/06.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-l from-black/35 via-black/55 to-black/5" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/0 to-black/20" />
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none mix-blend-screen"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
