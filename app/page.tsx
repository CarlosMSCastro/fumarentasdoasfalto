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
        <div className="absolute inset-0 bg-black/50" />
        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white md:text-6xl">
            FUMARENTAS DO ASFALTO
          </h1>
          <p className="mt-4 text-lg text-white/80">Associação de Motorizadas</p>
          <div className="mt-8 flex gap-4">
            <a href="/registo" className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">
              Inscrição
            </a>
            <a href="/portal" className="rounded-full border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              Portal do Sócio
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}