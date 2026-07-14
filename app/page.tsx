"use client";
import HeroSection from "@/components/HeroSection";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <HeroSection />
      <ObjetivosSection />
      <ContactosSection />
      <Footer />
    </div>
  );
}