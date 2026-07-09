"use client";
import { useRef, useEffect } from "react";
import Map from "@/components/Map";

export default function ContactoSection() {
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video2Ref.current;
    if (v) {
      v.currentTime = 3;
      v.play();
    }
  }, []);

  return (
    <section className="flex flex-col relative overflow-hidden snap-start" id="contactos">
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
        className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none scale-x-[-1] scale-y-[-1]"
        src="/videos/smoke.mp4"
        muted
        loop
        playsInline
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      {/* Título */}
      <div className="mx-auto w-full px-[8%] lg:px-[13%] mt-30 relative z-10">
        <h2 className="text-4xl lg:text-6xl font-bold text-white/90">Contactos</h2>
      </div>

      {/* Grid + CTA — desktop */}
      <div className="hidden lg:flex lg:pl-[8%] xl:pl-[13%] pr-[8%] xl:pr-[13%] mx-auto w-full py-12 relative z-10">
        <div className="grid grid-cols-11 gap-4 w-full min-w-0">
          <div className="min-w-0 col-span-4">
            <p className="text-orange-500 uppercase tracking-widest text-base xl:text-lg font-bold mb-4">Horário de Funcionamento</p>
            <div className="flex flex-col gap-2 text-white/70 text-base xl:text-xl">
              <div className="flex justify-between gap-2"><span className="font-bold text-white/90 shrink-0">Seg. a Sex.</span><span>10:30 às 18:00</span></div>
              <div className="flex justify-between gap-2"><span className="font-bold text-white/90 shrink-0">Sáb.</span><span>10:30 às 18:00</span></div>
              <div className="flex justify-between gap-2"><span className="font-bold text-white/90 shrink-0">Dom.</span><span>Fechado</span></div>
            </div>
          </div>
          <div className="min-w-0 col-span-3">
            <p className="text-orange-500 uppercase tracking-widest text-base xl:text-lg font-bold mb-4">Email</p>
            <div className="flex flex-col gap-2 text-white/70 text-base xl:text-xl">
              <span className="break-words">fumarentasdoasfalto@gmail.com</span>
            </div>
          </div>
          <div className="min-w-0 col-span-2">
            <p className="text-orange-500 uppercase tracking-widest text-base xl:text-lg font-bold mb-4">Endereço</p>
            <div className="flex flex-col gap-2 text-white/70 text-base xl:text-xl">
              <span>Rua do Espírito Santo</span>
              <span>4760-485 Fradelos VNF</span>
            </div>
          </div>
          <div className="min-w-0 col-span-2 flex flex-col items-start justify-start gap-2">
            <p className="text-orange-500 uppercase tracking-widest text-base xl:text-lg font-bold">Quer ser membro?</p>
            <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-8 py-3 font-bold uppercase tracking-widest text-white hover:bg-orange-600 transition-all text-base xl:text-lg">
              Formulário
            </a>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col lg:hidden pl-2 px-3 py-8 gap-2 relative z-10">
        <div className="p-6">
          <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Horário de Funcionamento</p>
          <div className="flex flex-col gap-3 text-white/70 text-xl">
            <div className="flex gap-12 pr-2"><span className="font-bold text-white/90">Seg. a Sex.</span><span>10:30 às 18:00</span></div>
            <div className="flex gap-25 pr-2"><span className="font-bold text-white/90">Sáb.</span><span>10:30 às 18:00</span></div>
            <div className="flex gap-35 pr-2"><span className="font-bold text-white/90">Dom.</span><span>Fechado</span></div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Email</p>
          <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-white/70 text-xl hover:text-orange-500 transition-colors">fumarentasdoasfalto@gmail.com</a>
        </div>
        <div className="flex gap-2">
          <div className="p-6 flex-1">
            <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Endereço</p>
            <div className="flex flex-col gap-2 text-white/70 text-xl">
              <span>Rua do Espírito Santo</span>
              <span>4760-485 Fradelos VNF</span>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center gap-2 -mt-5">
            <p className="text-orange-500 uppercase tracking-widest text-sm font-bold mb-1">Quer ser membro?</p>
            <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-9 py-2 font-bold uppercase tracking-widest text-white text-sm hover:bg-orange-600 transition-all text-center">
              Formulário
            </a>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="w-full h-[350px] relative z-10 ">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0d0d0d]/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d0d0d]/30 to-transparent z-10 pointer-events-none" />
        <Map />
      </div>

      {/* Copyright */}
      <div className="py-6 text-center text-white/40 text-sm border-white/10 relative z-10">
        © {new Date().getFullYear()} Fumarentas do Asfalto. Todos os direitos reservados.
      </div>

    </section>
  );
}