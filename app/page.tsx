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
        <div className="relative z-10 flex h-full flex-col items-start justify-center text-left mt- px-8 ml-0 md:ml-64 md:px-16">
          <p className="text-white/80 text-lg uppercase tracking-widest mb-2">Bem-vindo</p>
          <h1 className="text-5xl font-bold text-white md:text-6xl">
            FUMARENTAS DO ASFALTO
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-lg">
            Uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.
          </p>
          <div className="md:pt-50 pt-30 flex md:-ml-64 self-center gap-8">
            <a href="https://app.quotagest.com/app/inscricao/628097740e7fe9b9" className="rounded-full bg-orange-500 px-4 py-3 md:w-55 text-center md:text-lg font-semibold text-white hover:bg-orange-600">
              Novo Sócio
            </a>
            <a href="https://quolagest-wwit.quotagest.com/portal/login" className="rounded-full border border-white px-4 py-3 md:w-55 text-center md:text-lg font-semibold text-white hover:bg-white/10">
              Portal do Sócio
            </a>
          </div>
        </div>
      </section>
      <div className="h-screen bg-white/25" />
    </main>
  );
}