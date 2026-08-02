import Image from "next/image";

interface PageBackgroundProps {
  src: string;
  gradientX: string;
  gradientY: string;
  gradientTop: string;
}

// Fundo fixo ao viewport (position: fixed), partilhado entre secções ou
// páginas que scrollam por cima dele sem o remontar (ver comentários nos
// pontos de utilização). Qualquer secção seguinte com bg-background opaco
// (normalmente a ContactosSection) cobre isto por completo assim que entra
// no ecrã.
export default function PageBackground({ src, gradientX, gradientY, gradientTop }: PageBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className={`absolute inset-0 ${gradientX}`} />
      <div className={`absolute inset-0 ${gradientY}`} />
      <div className={`absolute inset-0 ${gradientTop}`} />
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
