"use client";
import { useRef, useState } from "react";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import EventosTimeline from "@/components/EventosTimeline";

export default function EventosPage() {
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
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative h-dvh w-full overflow-hidden snap-start">
        <video
          ref={normalRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-100"
          style={{ opacity: showNormal ? 1 : 0 }}
          src="/videos/drone.mp4"
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
          muted
          playsInline
          onEnded={handleReversoEnded}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/10 to-black/60" />
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/60" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="pt-50 md:pt-60 text-right px-[8%] md:px-[15%] ">
            <p className="text-white/90 text-xl uppercase tracking-widest mb-0
            ">Os nossos</p>
            <h1 className="text-4xl md:text-6xl font-bold text-white/90">Eventos</h1>
          </div>
          <div className="w-[79vw] mx-auto opacity-95 flex-1 flex items-center">
            <EventosTimeline />
          </div>
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[2vh] z-20" />
      </section>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}