import HeroSection from "@/components/HeroSection";
import PageBackground from "@/components/PageBackground";
import ObjetivosSection from "@/components/ObjetivosSection";
import ContactosSection from "@/components/ContactosSection";

export default function Home() {
  return (
    <>
      <PageBackground
        src="/sobremimwallpaper.jpg"
        gradientX="bg-linear-to-r from-black/55 via-black/15 to-black/5"
        gradientY="bg-linear-to-b from-black/0 via-black/20 to-black/60"
        gradientTop="bg-linear-to-t from-black/0 via-black/0 to-black/20"
      />
      <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
        <HeroSection />
        <ObjetivosSection />
        <ContactosSection />
      </div>
    </>
  );
}