"use client";
import Image from "next/image";

// Fundo partilhado entre HeroSection e ObjetivosSection — fixo ao viewport
// (position: fixed) em vez de fazer parte do fluxo de cada secção, para que
// ao percorrer entre as duas o fundo fique parado e só o conteúdo scrolle
// por cima. A ContactosSection tem o seu próprio bg-background opaco a
// seguir no DOM, o que a faz cobrir por completo este fundo fixo assim que
// entra no ecrã.
export default function HeroObjetivosBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/sobremimwallpaper.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Mesmo tratamento de cores da página /sobre — direção horizontal
          espelhada (to_r em vez de to_l) porque aqui o texto fica à
          esquerda, ao contrário do /sobre onde é à direita. */}
      <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/15 to-black/5" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/60" />
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
