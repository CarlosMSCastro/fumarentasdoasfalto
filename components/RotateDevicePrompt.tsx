import { Smartphone } from "lucide-react";

// O site é construído à volta de secções h-dvh com scroll-snap, pensadas
// para ecrã alto e estreito (mobile) ou pelo menos ~600-950px de altura
// (desktop/Macbook range) — um telemóvel em landscape (~350-430px de
// altura) fica fora das duas, e o conteúdo dessas secções (overflow-hidden
// por causa do snap) simplesmente não cabe. Em vez de afinar cada secção
// para uma 5ª classe de ecrã, mostra-se este aviso a cobrir tudo. Só
// telemóveis: a condição de altura máxima exclui laptops/desktop em
// landscape normal, que têm sempre bem mais altura disponível.
export default function RotateDevicePrompt() {
  return (
    <div
      aria-hidden="true"
      className="hidden [@media(max-height:500px)_and_(orientation:landscape)]:flex fixed inset-0 z-[200] bg-black flex-col items-center justify-center gap-4 px-8 text-center"
    >
      <Smartphone size={48} className="text-primary rotate-90" strokeWidth={1.5} />
      <p className="text-white text-lg font-semibold">Roda o teu telemóvel para a vertical.</p>
    </div>
  );
}
