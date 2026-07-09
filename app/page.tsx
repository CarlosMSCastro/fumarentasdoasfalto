"use client";
import HeroSection from "@/components/HeroSection";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-[100dvh]">
      <HeroSection />
      <ObjetivosSection />
      <ContactosSection />
    </div>
  );
}