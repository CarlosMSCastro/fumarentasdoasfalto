export default function ObjetivosDesktop() {
  return (
    <div className="hidden md:flex md:flex-row gap-3 w-full px-[8%] lg:px-[13%]">
      {[
        { title: "Encontros e Passeios", sub: "Rides, encontros e convívio", href: "/eventos", bg: "/conviv.jpg" },
        { title: "Restauração de Motorizadas", sub: "Partilha de conhecimento e técnica", href: "/contacto", bg: "/mecanica.jpg" },
        { title: "Workshops e Palestras", sub: "Aprende, ensina, evolui", href: "/eventos", bg: "/worksh.jpg" },
      ].map((item, i) => (
      <a 
      key={i}
        href={item.href}
        className="group relative rounded-sm flex-1 md:hover:flex-[2] transition-all duration-500 h-[60vh] md:h-[50vh] flex flex-col justify-between p-6"
      >
        <div className="absolute inset-0 overflow-hidden rounded-sm">
          <div
            className="absolute inset-0 bg-cover bg-center brightness-[0.55] group-hover:brightness-60 group-hover:scale-150 transition-all duration-500"
            style={{ backgroundImage: `url('${item.bg}')` }}
          />
        </div>
        <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white group-hover:text-2xl md:group-hover:text-3xl transition-all duration-300">{item.title}</h3>
        <div className="relative z-10 self-end bg-white/40 group-hover:bg-orange-500 text-white font-bold px-4 py-3 rounded-full transition-all duration-500">
          →
        </div>
      </a>
      ))}
    </div>
  );
}