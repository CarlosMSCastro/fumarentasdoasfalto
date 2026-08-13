import Image from "next/image";
import Link from "next/link";
import { PenSquare, Package } from "lucide-react";
import AuthPageBackground from "@/components/AuthPageBackground";

export default function AdminPage() {
  return (
    <AuthPageBackground footer={false}>
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Fumarentas do Asfalto"
          width={140}
          height={140}
          className="object-contain drop-shadow-[0_0_18px_rgba(var(--primary-rgb),0.7)] mb-6"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-[#f8f0d9] mb-10">
          Bem-vindo ao Painel de Administrador do Fumarentas do Asfalto
        </h1>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Sem href ainda — depende do Sanity estar provisionado. */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 opacity-50 cursor-not-allowed">
            <PenSquare size={40} className="text-white/60" />
            <span className="text-lg font-bold uppercase tracking-widest text-white/60">Editar Conteúdo</span>
            <span className="text-xs uppercase tracking-widest text-white/30">Brevemente</span>
          </div>

          <Link
            href="/admin/encomendas"
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Package size={40} className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-lg font-bold uppercase tracking-widest text-[#f8f0d9]">Encomendas</span>
          </Link>
        </div>
      </div>
    </AuthPageBackground>
  );
}
