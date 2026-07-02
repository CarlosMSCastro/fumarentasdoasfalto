"use client";


export default function Home() {
  return (
    
    <main className="flex flex-col">
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Vídeo */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Overlay horizontal */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/30" />
        {/* Overlay vertical bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col items-start justify-center text-left md:mt-18 mt-15 px-8 ml-0 md:ml-64 md:px-16">
          <p className="text-white/80 text-lg uppercase tracking-widest mb-2">Bem-vindo</p>
          <h1 className="text-5xl font-bold text-white md:text-6xl">
            FUMARENTAS DO ASFALTO
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-lg">
            Uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.
          </p>
          <div className="md:pt-50 pt-20 flex md:-ml-64 self-center gap-8">
            <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-4 py-3 md:w-55 w-40 text-center md:text-lg text-md font-semibold text-white hover:bg-orange-600">
              Novo Sócio
            </a>
            <a href="https://quolagest-wwit.quotagest.com/portal/login" className="rounded-full border border-white px-4 py-3 md:w-55 w-40 text-center md:text-lg text-md font-semibold text-white hover:bg-white/10">
              Portal do Sócio
            </a>
          </div>
        </div>
        {/* Scroll Indicator */}
        <button
          onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-[6vh] lg:bottom-15 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer bg-transparent border-none group"
        >
          <svg className="w-8 h-8 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <svg className="-mt-5 w-9 h-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>
      {/* SOBRE */}
      <section id="sobre" className="flex flex-col items-center justify-center min-h-screen py-30 gap-12 relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-60 pointer-events-none"
          src="/videos/smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        <div className="text-left mb-12 w-full px-3 md:pl-70 relative z-10">
          <p className="text-white/90 uppercase tracking-widest text-3xl mb-2">Os nossos</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white/90 mb-4">Objetivos</h2>
          <p className="text-white/50 text-xl max-w-2xl">
            Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-1 w-full max-w-7xl">
          {[
            { title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bg: "/conviv.jpg" },
            { title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/contacto", bg: "/mecanica.jpg" },
            { title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bg: "/worksh.jpg" },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden flex-1 md:hover:flex-[2] transition-all duration-500 h-[40vh] flex flex-col justify-between p-6"
              style={{ clipPath: "polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center brightness-[0.35] group-hover:brightness-50 transition-all duration-500"
                style={{ backgroundImage: `url('${item.bg}')` }}
              />
              <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white group-hover:text-orange-500 transition-all duration-300">{item.title}</h3>
              <a
                href={item.href}
                className="relative z-10 self-start bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-widest text-sm px-6 py-3 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
              >
                Saber mais
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}