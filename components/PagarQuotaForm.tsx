"use client";

import { useState } from "react";
import Image from "next/image";
import { formatarPreco } from "@/lib/preco";
import { pedirPagamentoQuota } from "@/app/actions/quota";

const METODOS = [
  { valor: "multibanco" as const, label: "Multibanco", logo: "/pagamento/Multibanco.png", width: 1920, height: 2268 },
  { valor: "mbway" as const, label: "MB WAY", logo: "/pagamento/Mbway.png", width: 1280, height: 622 },
];

export type EstadoPagamentoQuota =
  | { tipo: "nenhum" }
  | { tipo: "pendente"; metodoPagamento: "multibanco" | "mbway"; referenciaMb?: { entidade: string; referencia: string; valor: number } }
  | { tipo: "pago"; valor: number; paidAt: Date };

export type ReferenciaQuotagest = { entidade: string; referencia: string; valor: number; descricao: string };

// Não deixa escolher o valor (é sempre a dívida atual do sócio) nem repetir
// um pedido enquanto houver um pendente/pago — pedirPagamentoQuota já
// impõe as mesmas regras do lado do servidor, isto é só para não mostrar um
// formulário que ia ser recusado.
//
// referenciaQuotagest: quando o Quotagest já gerou (e mandou por email) uma
// referência Multibanco para este sócio (ex: "quota geral" lançada pelo
// Sr. Joaquim), não faz sentido o nosso canal gerar uma segunda referência
// Multibanco diferente — isso só confunde ("qual delas uso?"), mesmo que
// ninguém pague as duas. Nesse caso mostra-se essa referência e só se
// oferece MB WAY como via rápida alternativa pelo nosso canal (o Quotagest
// não costuma emitir pedidos MB WAY em massa, só referências Multibanco).
export default function PagarQuotaForm({
  divida,
  telefoneInicial,
  estadoInicial,
  referenciaQuotagest,
}: {
  divida: number;
  telefoneInicial: string;
  estadoInicial: EstadoPagamentoQuota;
  referenciaQuotagest: ReferenciaQuotagest | null;
}) {
  const [estado, setEstado] = useState<EstadoPagamentoQuota>(estadoInicial);
  const [aPagar, setAPagar] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<"multibanco" | "mbway">(referenciaQuotagest ? "mbway" : "multibanco");
  const [telemovelMbway, setTelemovelMbway] = useState(telefoneInicial);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const resultado = await pedirPagamentoQuota(metodoPagamento, metodoPagamento === "mbway" ? telemovelMbway : undefined);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setEstado({ tipo: "pendente", metodoPagamento: resultado.metodoPagamento, referenciaMb: resultado.referenciaMb });
      setAPagar(false);
    } finally {
      setLoading(false);
    }
  };

  if (estado.tipo === "pago") {
    return (
      <div className="text-sm text-white/70 space-y-1 border-t border-white/10 pt-2 mt-2">
        <p className="text-emerald-400 font-semibold">
          Pagaste a tua quota ({formatarPreco(estado.valor)}) em{" "}
          {estado.paidAt.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <p className="text-xs text-white/40 italic">Pode demorar até 48 horas até o site regularizar a tua situação.</p>
      </div>
    );
  }

  if (estado.tipo === "pendente") {
    return (
      <div className="text-sm text-white/70 space-y-1 border-t border-white/10 pt-2 mt-2">
        {estado.referenciaMb ? (
          <>
            <p>
              Entidade <span className="text-white/90 font-semibold">{estado.referenciaMb.entidade}</span>
            </p>
            <p>
              Referência <span className="text-white/90 font-semibold">{estado.referenciaMb.referencia}</span>
            </p>
            <p>
              Valor <span className="text-white/90 font-semibold">{formatarPreco(estado.referenciaMb.valor)}</span>
            </p>
          </>
        ) : (
          <p>Confirma o pagamento na app MB WAY do teu telemóvel.</p>
        )}
        <p className="text-xs text-white/40 italic pt-1">
          Pode demorar até 48 horas até o site regularizar a tua situação depois de pago.
        </p>
      </div>
    );
  }

  const cartaoReferenciaQuotagest = referenciaQuotagest && (
    <div className="text-sm text-white/70 space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Referência enviada pela associação</p>
      <p>
        Referente a <span className="text-white/90 font-semibold">{referenciaQuotagest.descricao}</span>
      </p>
      <p>
        Entidade <span className="text-white/90 font-semibold">{referenciaQuotagest.entidade}</span>
      </p>
      <p>
        Referência <span className="text-white/90 font-semibold">{referenciaQuotagest.referencia}</span>
      </p>
      <p>
        Valor <span className="text-white/90 font-semibold">{formatarPreco(referenciaQuotagest.valor)}</span>
      </p>
      <p className="text-xs text-white/40 italic">Já deves ter recebido isto por email da associação — usa para pagar por Multibanco.</p>
    </div>
  );

  if (!aPagar) {
    return (
      <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2.5">
        {cartaoReferenciaQuotagest}
        <button
          type="button"
          onClick={() => setAPagar(true)}
          className="self-start rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all cursor-pointer"
        >
          {referenciaQuotagest ? "Pagar já por MB WAY" : "Pagar Quota"}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2.5">
      {cartaoReferenciaQuotagest}
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <p className="text-sm text-white/70">
          Valor a pagar: <span className="text-white/90 font-semibold">{formatarPreco(divida)}</span>
        </p>
        {!referenciaQuotagest && (
          <div className="grid grid-cols-2 gap-2 max-w-56">
            {METODOS.map(({ valor, label, logo, width, height }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setMetodoPagamento(valor)}
                aria-label={label}
                className={`flex items-center justify-center rounded-sm bg-[#f8f0d9] px-3 py-2.5 transition-opacity cursor-pointer ${
                  metodoPagamento === valor ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={logo} alt={label} width={width} height={height} className="h-7 w-auto object-contain" />
              </button>
            ))}
          </div>
        )}
        {metodoPagamento === "mbway" && (
          <label className="flex flex-col gap-1 max-w-56">
            <span className="text-white/60 text-xs">Número MB WAY</span>
            <input
              required
              type="tel"
              placeholder="9XXXXXXXX"
              value={telemovelMbway}
              onChange={(e) => setTelemovelMbway(e.target.value)}
              className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </label>
        )}
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "A processar..." : "Confirmar"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setAPagar(false)}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
