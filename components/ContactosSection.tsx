"use client";

export default function ContactoSection() {
  return (
    <section className="flex flex-col relative overflow-hidden">

      {/* Título */}
      <div className="mx-auto w-full px-3 pl-7 md:pl-65 pt-16">
        <h2 className="text-4xl md:text-6xl font-bold text-white/90">Contactos</h2>
      </div>

      {/* Grid + CTA — desktop */}
      <div className="hidden md:flex md:pl-57 mx-auto w-full py-12 flex-row">
        <div className="grid grid-cols-3 gap-6 flex-1">
          <div className="p-8">
            <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-6">Horário de Funcionamento</p>
            <div className="flex flex-col gap-3 text-white/70 text-xl">
              <div className="flex justify-between"><span className="font-bold text-white/90">Seg. a Sex.</span><span>10:30 às 18:00</span></div>
              <div className="flex justify-between"><span className="font-bold text-white/90">Sáb.</span><span>10:30 às 18:00</span></div>
              <div className="flex justify-between"><span className="font-bold text-white/90">Dom.</span><span>Fechado</span></div>
            </div>
          </div>
          <div className="p-8">
            <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-6">Email</p>
            <div className="flex flex-col gap-2 text-white/70 text-xl">
              <span>fumarentasdoasfalto@gmail.com</span>
            </div>
          </div>
          <div className="p-8">
            <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-6">Endereço</p>
            <div className="flex flex-col gap-2 text-white/70 text-xl">
              <span>Rua do Espírito Santo</span>
              <span>4760-485 Fradelos VNF</span>
            </div>
          </div>
        </div>
        <div className="p-8 flex flex-col items-center justify-center gap-2 shrink-0 pr-80 -mt-19">
          <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-1">Quer ser membro?</p>
          <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-8 py-3 font-bold uppercase tracking-widest text-white hover:bg-orange-600 transition-all">
            Formulário
          </a>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col md:hidden pl-2 px-3 py-8 gap-2">
        <div className="p-6">
          <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Horário de Funcionamento</p>
          <div className="flex flex-col gap-3 text-white/70 text-base">
            <div className="flex justify-between"><span className="font-bold text-white/90">Seg. a Sex.</span><span>10:30 às 18:00</span></div>
            <div className="flex justify-between"><span className="font-bold text-white/90">Sáb.</span><span>10:30 às 18:00</span></div>
            <div className="flex justify-between"><span className="font-bold text-white/90">Dom.</span><span>Fechado</span></div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Email</p>
          <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-white/70 text-base hover:text-orange-500 transition-colors">fumarentasdoasfalto@gmail.com</a>
        </div>
        <div className="flex gap-2">
          <div className="p-6 flex-1">
            <p className="text-orange-500 uppercase tracking-widest text-xl font-bold mb-4">Endereço</p>
            <div className="flex flex-col gap-2 text-white/70 text-base">
              <span>Rua do Espírito Santo</span>
              <span>4760-485 Fradelos VNF</span>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-white/90 text-lg font-bold text-center">Quer ser membro?</p>
            <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-6 py-2 font-bold uppercase tracking-widest text-white text-xl hover:bg-orange-600 transition-all text-center">
              Formulário
            </a>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="w-full h-[400px]">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4279.333821468431!2d-8.59605679832368!3d41.37345599518911!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd245b9316299c15%3A0x209caad7f7d24c42!2sR.%20do%20Esp%C3%ADrito%20Santo%2C%20Fradelos%2C%20Portugal!5e0!3m2!1spt-BR!2sus!4v1783446363199!5m2!1spt-BR!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          className="grayscale brightness-[0.3]"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {/* Copyright */}
      <div className="py-6 text-center text-white/40 text-sm border-t border-white/10">
        © {new Date().getFullYear()} Fumarentas do Asfalto. Todos os direitos reservados.
      </div>

    </section>
  );
}