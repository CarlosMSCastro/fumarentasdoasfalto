import Image from "next/image";
import Link from "next/link";
import { PenSquare, Package } from "lucide-react";
import AuthPageBackground from "@/components/AuthPageBackground";

export default function AdminPage() {
  return (
    <AuthPageBackground footer={false} compactPaddingMobile>
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* Logo ao lado do título no mobile (poupa altura); volta a
            empilhar por cima a partir do sm, como sempre esteve. */}
        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-0 mb-6 sm:mb-10 text-left sm:text-center">
          <Image
            src="/logo.png"
            alt="Fumarentas do Asfalto"
            width={140}
            height={140}
            className="object-contain drop-shadow-[0_0_18px_rgba(var(--primary-rgb),0.7)] w-14 h-14 sm:w-35 sm:h-35 shrink-0 sm:mb-6"
          />
          <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-[#f8f0d9]">
            Bem-vindo ao Painel de Administrador do Fumarentas do Asfalto
          </h1>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 sm:gap-6">
          {/* Sem href ainda — depende do Sanity estar provisionado. */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 opacity-50 cursor-not-allowed">
            <PenSquare className="w-6 h-6 sm:w-10 sm:h-10 text-white/60" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-white/60 text-center">Editar Conteúdo</span>
            <span className="text-[9px] sm:text-xs uppercase tracking-widest text-white/30">Brevemente</span>
          </div>

          <Link
            href="/admin/encomendas"
            className="flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Package className="w-6 h-6 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-center">Encomendas</span>
          </Link>
        </div>
      </div>
    </AuthPageBackground>
  );
}
