"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CreditCard, Landmark, Smartphone, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatarPreco } from "@/lib/produtos";
import { PORTES_EUROS } from "@/lib/encomendas";
import { criarEncomenda, type DadosEncomenda, type EncomendaResultado } from "@/app/actions/encomendas";

interface DadosIniciais {
  nome: string;
  email: string;
  telefone: string;
  moradaLinha: string;
  codigoPostal: string;
  cidade: string;
}

const METODOS: { valor: DadosEncomenda["metodoPagamento"]; label: string; icon: typeof Landmark }[] = [
  { valor: "multibanco", label: "Multibanco", icon: Landmark },
  { valor: "mbway", label: "MB WAY", icon: Smartphone },
  { valor: "cartao", label: "Cartão", icon: CreditCard },
];

export default function CheckoutForm({ initial }: { initial: DadosIniciais }) {
  const { items, subtotal, limpar } = useCart();
  const [dados, setDados] = useState<DadosIniciais>(initial);
  const [metodoPagamento, setMetodoPagamento] = useState<DadosEncomenda["metodoPagamento"]>("multibanco");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<EncomendaResultado | null>(null);

  const portes = items.length > 0 ? PORTES_EUROS : 0;
  const total = subtotal + portes;

  useEffect(() => {
    if (resultado && "redirectUrl" in resultado && resultado.redirectUrl) {
      window.location.href = resultado.redirectUrl;
    }
  }, [resultado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await criarEncomenda(
        items.map((item) => ({
          produtoId: item.produtoId,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          cor: item.cor,
          tamanho: item.tamanho,
        })),
        { ...dados, metodoPagamento }
      );
      if ("error" in res) {
        setErro(res.error);
        return;
      }
      limpar();
      setResultado(res);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !resultado) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-white/70 text-base md:text-lg">O teu carrinho está vazio.</p>
        <Link
          href="/loja"
          className="rounded-full bg-primary text-white font-bold uppercase tracking-widest text-sm px-6 py-2.5 hover:bg-[var(--primary-hover)] transition-colors"
        >
          Ir para a Loja
        </Link>
      </div>
    );
  }

  if (resultado && !("redirectUrl" in resultado && resultado.redirectUrl)) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-4 text-center px-4">
        <CheckCircle2 className="text-primary" size={48} strokeWidth={1.5} />
        <h2 className="text-[#f8f0d9] text-xl md:text-2xl font-bold">Encomenda registada</h2>

        {"referenciaMb" in resultado && resultado.referenciaMb && (
          <div className="bg-[#f8f0d9] rounded-sm px-6 py-4 text-black/85">
            <p className="text-xs uppercase tracking-widest text-black/50 mb-1">Referência Multibanco</p>
            <p className="font-bold text-lg">Entidade {resultado.referenciaMb.entidade}</p>
            <p className="font-bold text-lg">Referência {resultado.referenciaMb.referencia}</p>
          </div>
        )}

        {metodoPagamento === "mbway" && !("pagamentoError" in resultado && resultado.pagamentoError) && (
          <p className="text-white/70 text-sm max-w-xs">Confirma o pagamento na app MB WAY do teu telemóvel.</p>
        )}

        {"pagamentoError" in resultado && resultado.pagamentoError && (
          <p className="text-white/70 text-sm max-w-sm">
            A tua encomenda ficou registada, mas o pagamento automático ainda não está disponível — a associação vai
            entrar em contacto contigo para combinar o pagamento.
          </p>
        )}

        <Link href="/" className="text-primary text-sm font-semibold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pb-2">
        {/* Contacto / morada */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-primary text-sm font-bold uppercase tracking-widest">Contacto e morada</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-white/60 text-xs">Nome</span>
              <input
                required
                value={dados.nome}
                onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-white/60 text-xs">Email</span>
              <input
                required
                type="email"
                value={dados.email}
                onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-white/60 text-xs">Telefone{metodoPagamento === "mbway" && " (MB WAY)"}</span>
              <input
                required
                type="tel"
                value={dados.telefone}
                onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-white/60 text-xs">Código postal</span>
              <input
                value={dados.codigoPostal}
                onChange={(e) => setDados((d) => ({ ...d, codigoPostal: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-white/60 text-xs">Morada</span>
              <input
                value={dados.moradaLinha}
                onChange={(e) => setDados((d) => ({ ...d, moradaLinha: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-white/60 text-xs">Cidade</span>
              <input
                value={dados.cidade}
                onChange={(e) => setDados((d) => ({ ...d, cidade: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>

        {/* Resumo + pagamento */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-primary text-sm font-bold uppercase tracking-widest">Resumo da encomenda</h2>
          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={`${item.produtoId}|${item.cor ?? ""}|${item.tamanho ?? ""}`} className="flex items-center gap-2">
                <div className="relative w-9 h-9 shrink-0 rounded-sm overflow-hidden bg-[#f8f0d9]">
                  <Image src={item.imagemSrc} alt={item.nome} fill sizes="36px" className="object-cover" />
                </div>
                <p className="flex-1 min-w-0 text-white/80 text-xs truncate">
                  {item.quantidade}× {item.nome}
                  {(item.cor || item.tamanho) && (
                    <span className="text-white/40"> · {[item.cor, item.tamanho].filter(Boolean).join(" · ")}</span>
                  )}
                </p>
                <span className="text-white/80 text-xs font-semibold shrink-0">{formatarPreco(item.preco * item.quantidade)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 pt-1 border-t border-white/10 text-sm text-white/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatarPreco(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Portes</span>
              <span>{formatarPreco(portes)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#f8f0d9]">
              <span>Total</span>
              <span>{formatarPreco(total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-white/60 text-xs">Método de pagamento</span>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map(({ valor, label, icon: Icon }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setMetodoPagamento(valor)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border py-2 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                    metodoPagamento === valor
                      ? "bg-primary border-primary text-white"
                      : "border-white/20 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-primary text-white font-bold uppercase tracking-widest text-sm py-2.5 hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "A processar..." : "Confirmar e pagar"}
          </button>
        </div>
      </form>
    </div>
  );
}
