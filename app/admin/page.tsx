import Image from "next/image";
import Link from "next/link";
import { count, gt } from "drizzle-orm";
import { PenSquare, Package, IdCard, Users, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { obterUltimasVisitas } from "@/lib/admin-notificacoes";
import { getTodosSocios } from "@/lib/quotagest";
import AuthPageBackground from "@/components/AuthPageBackground";

type ResumoAdmin = {
  novasEncomendas: number;
  novosUtilizadores: number;
  novosSocios: number;
  totalEncomendas: number;
  totalUtilizadores: number;
  totalSocios: number;
};

// "Novo" = criado depois da última visita registada a essa secção (ver
// lib/admin-notificacoes.ts) — nunca visitada conta tudo como novo. Sócios
// vêm do Quotagest, por isso falha em separado e suave: se estiver em baixo,
// o badge/total correspondente só não aparece, o resto do ecrã inicial
// continua normal.
async function getResumoAdmin(): Promise<ResumoAdmin> {
  const ultimasVisitas = await obterUltimasVisitas();

  const [novasEncomendasRows, totalEncomendasRows, novosUtilizadoresRows, totalUtilizadoresRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(orders)
      .where(ultimasVisitas.encomendas ? gt(orders.createdAt, ultimasVisitas.encomendas) : undefined),
    db.select({ total: count() }).from(orders),
    db
      .select({ total: count() })
      .from(users)
      .where(ultimasVisitas.utilizadores ? gt(users.createdAt, ultimasVisitas.utilizadores) : undefined),
    db.select({ total: count() }).from(users),
  ]);

  let novosSocios = 0;
  let totalSocios = 0;
  try {
    const socios = await getTodosSocios();
    totalSocios = socios.length;
    novosSocios = ultimasVisitas.socios
      ? socios.filter((s) => s.dataEntrada && new Date(s.dataEntrada) > ultimasVisitas.socios!).length
      : socios.length;
  } catch {
    novosSocios = 0;
    totalSocios = 0;
  }

  return {
    novasEncomendas: novasEncomendasRows[0]?.total ?? 0,
    novosUtilizadores: novosUtilizadoresRows[0]?.total ?? 0,
    novosSocios,
    totalEncomendas: totalEncomendasRows[0]?.total ?? 0,
    totalUtilizadores: totalUtilizadoresRows[0]?.total ?? 0,
    totalSocios,
  };
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]">
      {n}
    </span>
  );
}

export default async function AdminPage() {
  const { novasEncomendas, novosSocios, novosUtilizadores, totalEncomendas, totalUtilizadores, totalSocios } =
    await getResumoAdmin();

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
            className="object-contain drop-shadow-[0_0_18px_rgba(var(--primary-rgb),0.7)] w-14 h-14 sm:w-35 sm:h-35 shrink-0 -mt-2 sm:-mt-4 sm:mb-6"
          />
          <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-[#f8f0d9]">
            Bem-vindo ao Painel de Administrador do Fumarentas do Asfalto
          </h1>
        </div>

        <p className="hidden sm:block w-full text-right text-xs text-white/40 mb-3">
          {totalSocios} sócios · {totalUtilizadores} utilizadores · {totalEncomendas} encomendas
        </p>

        <div className="w-full flex flex-col gap-3 sm:gap-4">
          <Link
            href="/admin/conteudo"
            className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-6 sm:py-5 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <PenSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] shrink-0" />
            <span className="flex-1 text-sm sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-left">Editar Conteúdo</span>
            <ChevronRight className="w-5 h-5 text-white/30 shrink-0" />
          </Link>

          <Link
            href="/admin/encomendas"
            className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-6 sm:py-5 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] shrink-0" />
            <span className="flex-1 text-sm sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-left">Encomendas</span>
            <Badge n={novasEncomendas} />
            <ChevronRight className="w-5 h-5 text-white/30 shrink-0" />
          </Link>

          <Link
            href="/admin/socios"
            className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-6 sm:py-5 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <IdCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] shrink-0" />
            <span className="flex-1 text-sm sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-left">Sócios</span>
            <Badge n={novosSocios} />
            <ChevronRight className="w-5 h-5 text-white/30 shrink-0" />
          </Link>

          <Link
            href="/admin/utilizadores"
            className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-6 sm:py-5 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] shrink-0" />
            <span className="flex-1 text-sm sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-left">Utilizadores</span>
            <Badge n={novosUtilizadores} />
            <ChevronRight className="w-5 h-5 text-white/30 shrink-0" />
          </Link>
        </div>
      </div>
    </AuthPageBackground>
  );
}
