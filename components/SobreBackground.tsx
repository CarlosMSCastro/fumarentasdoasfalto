"use client";
import Image from "next/image";

// Fundo partilhado entre a secção "História" e a FoundersSection da página
// /sobre — fixo ao viewport (position: fixed) em vez de fazer parte do
// fluxo de cada secção, para que ao percorrer entre as duas o fundo fique
// parado e só o conteúdo scrolle por cima. Mesmo padrão do
// <HeroObjetivosBackground /> usado na homepage. A ContactosSection tem o
// seu próprio bg-background opaco a seguir no DOM, o que a faz cobrir por
// completo este fundo fixo assim que entra no ecrã.
export default function SobreBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/sobremimwallpaper2.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-l from-black/75 via-black/55 to-black/5" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0" />
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/0 to-black/30" />
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
