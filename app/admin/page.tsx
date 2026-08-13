import Image from "next/image";
import Link from "next/link";
import { count, gt } from "drizzle-orm";
import { PenSquare, Package, IdCard, Users } from "lucide-react";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { obterUltimasVisitas } from "@/lib/admin-notificacoes";
import { getTodosSocios, getEstatisticasFinanceiras, type EstatisticasFinanceiras } from "@/lib/quotagest";
import { formatarPreco } from "@/lib/preco";
import AuthPageBackground from "@/components/AuthPageBackground";

type ResumoAdmin = {
  novasEncomendas: number;
  novosUtilizadores: number;
  novosSocios: number;
  financeiro: EstatisticasFinanceiras | null;
};

// "Novo" = criado depois da última visita registada a essa secção (ver
// lib/admin-notificacoes.ts) — nunca visitada conta tudo como novo. Sócios e
// financeiro vêm do Quotagest, por isso falham em separado e suave: se
// estiver em baixo, os badges/tiles correspondentes só não aparecem, o resto
// do ecrã inicial continua normal.
async function getResumoAdmin(): Promise<ResumoAdmin> {
  const ultimasVisitas = await obterUltimasVisitas();

  const [novasEncomendasRows, novosUtilizadoresRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(orders)
      .where(ultimasVisitas.encomendas ? gt(orders.createdAt, ultimasVisitas.encomendas) : undefined),
    db
      .select({ total: count() })
      .from(users)
      .where(ultimasVisitas.utilizadores ? gt(users.createdAt, ultimasVisitas.utilizadores) : undefined),
  ]);

  let novosSocios = 0;
  try {
    const socios = await getTodosSocios();
    novosSocios = ultimasVisitas.socios
      ? socios.filter((s) => s.dataEntrada && new Date(s.dataEntrada) > ultimasVisitas.socios!).length
      : socios.length;
  } catch {
    novosSocios = 0;
  }

  const financeiro = await getEstatisticasFinanceiras().catch(() => null);

  return {
    novasEncomendas: novasEncomendasRows[0]?.total ?? 0,
    novosUtilizadores: novosUtilizadoresRows[0]?.total ?? 0,
    novosSocios,
    financeiro,
  };
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]">
      {n}
    </span>
  );
}

export default async function AdminPage() {
  const { novasEncomendas, novosSocios, novosUtilizadores, financeiro } = await getResumoAdmin();

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
          <Link
            href="/admin/conteudo"
            className="flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <PenSquare className="w-6 h-6 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-center">Editar Conteúdo</span>
          </Link>

          <Link
            href="/admin/encomendas"
            className="relative flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Badge n={novasEncomendas} />
            <Package className="w-6 h-6 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-center">Encomendas</span>
          </Link>

          <Link
            href="/admin/socios"
            className="relative flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Badge n={novosSocios} />
            <IdCard className="w-6 h-6 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-center">Sócios</span>
          </Link>

          <Link
            href="/admin/utilizadores"
            className="relative flex flex-col items-center gap-1.5 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-6 sm:py-10 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] transition-all"
          >
            <Badge n={novosUtilizadores} />
            <Users className="w-6 h-6 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            <span className="text-xs sm:text-lg font-bold uppercase tracking-widest text-[#f8f0d9] text-center">Utilizadores</span>
          </Link>
        </div>

        {/* Só desktop — no mobile o ecrã inicial tem de caber sem scroll
            (ver comentário histórico sobre isto), e isto é informação extra,
            não essencial como os cards de navegação. */}
        {financeiro && (
          <div className="hidden sm:grid w-full grid-cols-2 gap-6 mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Recebido em {new Date().getFullYear()}</span>
              <p className="text-2xl font-bold text-[#f8f0d9] mt-1">{formatarPreco(financeiro.totalPagoAno)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Sócios em dívida</span>
              <p className="text-2xl font-bold text-[#f8f0d9] mt-1">
                {formatarPreco(financeiro.totalEmDivida)}
                <span className="text-sm font-semibold text-white/40 ml-2">
                  · {financeiro.numeroSociosEmDivida} sócio{financeiro.numeroSociosEmDivida === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthPageBackground>
  );
}
