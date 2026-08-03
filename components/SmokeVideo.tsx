"use client";
import { useEffect, useRef } from "react";

interface SmokeVideoProps {
  className?: string;
}

// Só reproduz enquanto a secção está (ou perto de estar) visível — várias
// secções da página têm o seu próprio vídeo de fumo (ex: o fundo partilhado
// + a ContactosSection, que fica sempre montada mas scrollada para fora de
// vista), e sem isto todos decodificam em simultâneo desde o load da
// página, mesmo os que não se veem. Em telemóveis, o decoder de vídeo por
// hardware normalmente só aguenta bem 1 stream em simultâneo — o resto cai
// para decodificação por software, daí o lag.
export default function SmokeVideo({ className }: SmokeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px 0px 200px 0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src="/videos/smoke.mp4"
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
