"use client";
import HeroSection from "@/components/HeroSection";
import HeroObjetivosBackground from "@/components/HeroObjetivosBackground";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
  return (
    <>
      <HeroObjetivosBackground />
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <HeroSection />
        <ObjetivosSection />
        <ContactosSection />
      </div>
    </>
  );
}