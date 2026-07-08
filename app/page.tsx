"use client";
import { useRef, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    const sync = () => {
      const duration = v1.duration;
      if (!duration) return;
      v2.currentTime = (v1.currentTime + 6) % duration;
    };

    v1.addEventListener("timeupdate", sync);
    return () => v1.removeEventListener("timeupdate", sync);
  }, []);

  return (
    <>
      <HeroSection />
      <main className="flex flex-col relative overflow-hidden">
        <video
          ref={video1Ref}
          className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <video
          ref={video2Ref}
          className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-30 pointer-events-none scale-x-[-1] scale-y-[-1]"
          src="/videos/smoke.mp4"
          muted
          loop
          playsInline
        />
        <ObjetivosSection />
        <ContactosSection />
      </main>
    </>
  );
}