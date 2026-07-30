import Image from "next/image";
import Footer from "@/components/Footer";

// Fundo partilhado por /login, /registo, /esqueci-me-da-password e
// /redefinir-password — mesmo wallpaper/gradientes/fumo que a FoundersSection
// usa, mas sem o ContactosSection completo (só o Footer, como estas páginas
// são de formulário, não precisam de horário/mapa/etc.).
export default function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full flex flex-col overflow-hidden">
      <Image
        src="/sobremimwallpaper2.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-l from-black/55 via-black/65 to-black/65" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50" />
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/20 to-black/60" />
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none mix-blend-screen"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-24">
        {children}
      </div>
      <Footer />
    </div>
  );
}
