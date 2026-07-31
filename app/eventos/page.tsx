"use client";
import ContactoSection from "@/components/ContactosSection";
import ScrollIndicator from "@/components/ScrollIndicator";
import EventosTimeline from "@/components/EventosTimeline";

export default function EventosPage() {
  return (
    <div id="snap-container" className="snap-y snap-mandatory overflow-y-scroll h-dvh">
      <section className="relative h-dvh w-full overflow-hidden snap-start">
        <div className="flex h-full flex-col">
          <div className="relative z-0 w-[100vw] md:w-[79vw] mx-auto opacity-95 flex-1 min-h-0 flex flex-col items-end justify-start pb-[clamp(1.5rem,8dvh,10rem)] md:pb-[13dvh] [@media(min-width:768px)_and_(max-width:1728px)_and_(max-height:950px)]:pb-[9dvh]">
            <div className="relative z-0 pt-[clamp(3rem,12dvh,8.75rem)] md:pt-[clamp(9.5rem,9dvh,11.25rem)] text-right px-[8%] md:px-[15%]">
              <p className="text-white/90 text-xl uppercase tracking-widest mb-0">Os nossos</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white/90">Eventos</h1>
            </div>
            <EventosTimeline />
          </div>
        </div>

        <ScrollIndicator targetId="contactos" className="bottom-[1vh] md:bottom-[2vh] z-20" compact />
      </section>
      <div className="snap-start">
        <ContactoSection />
      </div>
    </div>
  );
}
