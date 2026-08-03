"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";

const EXACT_ROUTES = ["/", "/sobre", "/eventos"];
const PREFIX_ROUTES = ["/eventos/"];

// Foto + vídeo de fumo + gradientes, tudo partilhado entre Home, Sobre e
// Eventos — vive no layout raiz (fora do {children}, tal como a <Navbar />),
// por isso não é apanhado pelo fade de transição de página nem
// desmontado/reiniciado ao navegar entre estas páginas. O gradiente
// horizontal é simétrico (escurece os dois lados) de propósito: a Home tem
// texto à esquerda e o Sobre à direita, e um gradiente só de um lado
// prejudicava a legibilidade numa das duas.
export default function SharedBackground() {
  const pathname = usePathname();
  const matches = EXACT_ROUTES.includes(pathname) || PREFIX_ROUTES.some((p) => pathname.startsWith(p));
  if (!matches) return null;

  return (
    <div className="fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      <Image src="/sobremimwallpaper.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/10 to-black/50" />
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/25 to-black/65" />
      <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/10 to-black/25" />
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none mix-blend-screen"
        src="/videos/smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
