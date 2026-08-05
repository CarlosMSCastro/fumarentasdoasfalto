"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { getProdutos, formatarPreco, type Produto } from "@/lib/produtos";

const produtos = getProdutos();

const CORES_HEX: Record<string, string> = {
  "Branco": "#ffffff",
  "Roxo": "#7c3aed",
};

function corParaHex(nome: string): string {
  return CORES_HEX[nome] ?? "#999999";
}

// Ainda não há fotos reais dos produtos (pastas em public/loja/ vazias) — em
// vez de deixar o <Image> partido, cai para um ícone quando o ficheiro não
// existe. Assim que as fotos forem adicionadas, isto resolve-se sozinho.
function ProdutoImagem({ produto }: { produto: Produto }) {
  const [erro, setErro] = useState(false);

  if (erro) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/10">
        <ShoppingBag className="text-black/25" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={`/loja/${produto.pasta}/${produto.capa}`}
      alt={produto.nome}
      fill
      sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 19vw"
      className="object-cover"
      onError={() => setErro(true)}
    />
  );
}

function ProdutoCard({
  produto,
  index,
  ativo,
  onToggle,
}: {
  produto: Produto;
  index: number;
  ativo: boolean;
  onToggle: () => void;
}) {
  const rotate = index % 2 === 0 ? "-rotate-2" : "rotate-1.5";
  const hoverRotate = index % 2 === 0 ? "group-hover:rotate-2" : "group-hover:-rotate-1.5";
  const temOpcoes = !!(produto.tamanhos?.length || produto.cores?.length);
  const [corSelecionada, setCorSelecionada] = useState(produto.cores?.[0]);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(produto.tamanhos?.[0]);

  return (
    // Célula da grid: tamanho fixo (aspect-ratio, igual em todos os
    // breakpoints), nunca reage ao hover/tap — é o que evita que o
    // crescimento de um card empurre/estique os vizinhos (grid stretch por
    // defeito).
    <div data-loja-card className="group relative aspect-[4/5]">
      {/* Card visível: sempre absolute, ancorado ao fundo (bottom:0, "top"
          nunca definido — fica "auto" por omissão) e sem altura própria
          explícita. A altura é sempre intrínseca ao conteúdo (foto + texto,
          rodapé colapsado a 0fr em repouso), por isso crescer/encolher é só
          o conteúdo (rodapé) a mudar de tamanho — não há transição própria
          no "top", que ia lutar com essa reflow e causar o salto ao
          encolher. Mesma técnica do EventosTimeline. No desktop o gatilho é
          :hover (md:group-hover:*); no mobile, sem hover, o mesmo estado é
          replicado ao tocar (prop `ativo`, ver LojaGrid). */}
      <div
        onClick={() => {
          // Em desktop (rato, suporta hover) o crescimento já é tratado pelo
          // :hover — um click aqui não deve "fixar" o card aberto. Só faz
          // toggle em dispositivos sem hover (touch), que é o caso que este
          // clique resolve.
          if (window.matchMedia("(hover: hover)").matches) return;
          onToggle();
        }}
        className={`absolute bottom-0 h-auto origin-bottom flex flex-col rounded-sm overflow-hidden bg-[#f8f0d9] shadow-[0_18px_35px_rgba(0,0,0,100)] transition-all duration-500 ease-out cursor-pointer md:group-hover:z-30 md:group-hover:-inset-x-[14%] md:group-hover:shadow-[0_28px_55px_rgba(0,0,0,100)] ${rotate} ${hoverRotate} ${
          ativo ? "z-30 -inset-x-[32%] shadow-[0_28px_55px_rgba(0,0,0,100)]" : "inset-x-0"
        }`}
      >
        <div className="relative aspect-square m-2 overflow-hidden rounded-sm">
          <ProdutoImagem produto={produto} />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
          {!produto.disponivel && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
              <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wide">Indisponível</span>
            </div>
          )}
        </div>
        <div className="shrink-0 px-3 pb-2 pt-1 text-center">
          <p className="text-black/85 font-bold uppercase leading-tight text-xs md:text-base line-clamp-2">
            {produto.nome}
          </p>
          <p className="text-primary font-bold text-xs md:text-base">{formatarPreco(produto.preco)}</p>

          {/* Carrinho/checkout ainda não existem — botões só de momento
              visuais, sem onClick real (mas com stopPropagation para não
              fechar o card ao tocar neles). A seleção de cor/tamanho já é
              real (estado local do card), só não alimenta nenhum carrinho. */}
          {produto.disponivel && (
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-out md:group-hover:grid-rows-[1fr] ${
                ativo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-1 pt-1 md:gap-1.5 md:pt-2">
                  {temOpcoes && (
                    <div className="flex items-center justify-center gap-1 flex-wrap md:gap-1.5 md:pb-0.5">
                      {produto.cores?.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          title={cor}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCorSelecionada(cor);
                          }}
                          className={`w-4 h-4 md:w-5 md:h-5 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform ${
                            corSelecionada === cor
                              ? "ring-2 ring-offset-2 ring-offset-[#f8f0d9] ring-black/80"
                              : "border border-black/25"
                          }`}
                          style={{ backgroundColor: corParaHex(cor) }}
                        />
                      ))}
                      {produto.tamanhos?.map((tam) => (
                        <button
                          key={tam}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTamanhoSelecionado(tam);
                          }}
                          className={`h-4.5 px-1.5 md:h-6 md:px-2.5 flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                            tamanhoSelecionado === tam
                              ? "bg-black/85 text-white border border-black/85"
                              : "border border-black/30 text-black/80 hover:bg-black/85 hover:text-white hover:border-black/85"
                          }`}
                        >
                          {tam}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-full border border-black/30 text-black/80 text-[8px] md:text-[11px] font-bold uppercase tracking-wide py-0.5 md:py-1.5 hover:bg-black/85 hover:text-white hover:border-black/85 transition-colors cursor-pointer"
                  >
                    Adicionar ao carrinho
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-full bg-primary text-white text-[8px] md:text-[11px] font-bold uppercase tracking-wide py-0.5 md:py-1.5 hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
                  >
                    Comprar agora
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LojaGrid() {
  const [ativoIndex, setAtivoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (ativoIndex === null) return;
    // Tocar fora de qualquer card (mobile) fecha o que estiver aberto. Um
    // toque DENTRO de um card (o mesmo ou outro) não faz nada aqui — quem
    // trata isso é o onClick de cada card (toggle / trocar para o novo).
    const fecharSeForaDeUmCard = (e: PointerEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (!alvo?.closest("[data-loja-card]")) setAtivoIndex(null);
    };
    document.addEventListener("pointerdown", fecharSeForaDeUmCard);
    return () => document.removeEventListener("pointerdown", fecharSeForaDeUmCard);
  }, [ativoIndex]);

  return (
    <div className="w-full mx-auto flex-1 min-h-0 p-3 md:p-16 grid grid-cols-3 md:grid-cols-5 gap-x-3 gap-y-10 md:gap-8 content-start">
      {produtos.map((produto, i) => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          index={i}
          ativo={ativoIndex === i}
          onToggle={() => setAtivoIndex((atual) => (atual === i ? null : i))}
        />
      ))}
    </div>
  );
}
