"use client";
import { useRef, useState } from "react";

// Duas versões do mesmo voo de drone (normal e reverso) que se alternam em
// loop contínuo — quando uma termina, a outra arranca do início, dando a
// ilusão de um único voo de ida e volta sem corte percetível.
export default function DroneVideoBackground() {
  const [showNormal, setShowNormal] = useState(true);
  const normalRef = useRef<HTMLVideoElement>(null);
  const reversoRef = useRef<HTMLVideoElement>(null);

  const handleNormalEnded = () => {
    setShowNormal(false);
    if (reversoRef.current) reversoRef.current.currentTime = 0;
    reversoRef.current?.play();
  };

  const handleReversoEnded = () => {
    setShowNormal(true);
    if (normalRef.current) normalRef.current.currentTime = 0;
    normalRef.current?.play();
  };

  return (
    <>
      <video
        ref={normalRef}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
        style={{ opacity: showNormal ? 1 : 0 }}
        src="/videos/drone.mp4"
        poster="/videos/drone-poster.jpg"
        autoPlay
        muted
        playsInline
        onEnded={handleNormalEnded}
      />
      <video
        ref={reversoRef}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
        style={{ opacity: showNormal ? 0 : 1 }}
        src="/videos/drone-reverso.mp4"
        poster="/videos/drone-reverso-poster.jpg"
        muted
        playsInline
        onEnded={handleReversoEnded}
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-black/30" />
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/15 to-black/60" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/15 to-black/90" />
    </>
  );
}
