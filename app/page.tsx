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
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/30" />
        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col items-start justify-center text-left px-8 ml-0 md:ml-64 md:px-16">
          <p className="text-white/80 text-lg uppercase tracking-widest mb-2">Bem-vindo à</p>
          <h1 className="text-5xl font-bold text-white md:text-6xl">
            FUMARENTAS DO ASFALTO
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-lg">
            Uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.
          </p>
          <div className="mt-8 flex gap-8">
            <a href="/registo" className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">
              Inscrição
            </a>
            <a href="/portal" className="rounded-full border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              Portal do Sócio
            </a>
          </div>
        </div>
      </section>
      <div className="h-screen bg-zinc-900" />
    </main>
  );
}