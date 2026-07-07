"use client";
import HeroSection from "@/components/HeroSection";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
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
        <ObjetivosSection />
        <ContactosSection />
      </main>
    </>
  );
}