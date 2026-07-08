"use client";
import { useRef, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video2Ref.current;
    if (v) {
      v.currentTime = 6;
      v.play();
    }
  }, []);

  return (
    <>
      <HeroSection />
      <main className="flex flex-col relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <video
          ref={video2Ref}
          className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-70 pointer-events-none scale-x-[-1] scale-y-[-1]"
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