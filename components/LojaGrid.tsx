"use client";
import Image from "next/image";
import { useState } from "react";
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

function ProdutoCard({ produto, index }: { produto: Produto; index: number }) {
  const rotate = index % 2 === 0 ? "-rotate-2" : "rotate-1.5";
  const hoverRotate = index % 2 === 0 ? "group-hover:rotate-2" : "group-hover:-rotate-1.5";
  const temOpcoes = !!(produto.tamanhos?.length || produto.cores?.length);
  const [corSelecionada, setCorSelecionada] = useState(produto.cores?.[0]);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(produto.tamanhos?.[0]);

  return (
    // Célula da grid: tamanho fixo (aspect-ratio no desktop), nunca reage ao
    // hover — é o que evita que o crescimento de um card empurre/estique os
    // vizinhos (grid stretch por defeito).
    <div className="group relative min-h-44 md:aspect-[4/5] md:min-h-0">
      {/* Card visível: em mobile ocupa a célula normalmente (static); a
          partir de md passa a absolute, ocupando a célula por omissão e
          ancorada ao fundo (bottom:0 fixo) — no hover o "top" desprende-se
          e a altura passa a ser ditada pelo conteúdo, por isso cresce para
          CIMA (sobrepondo o título acima), tal como no EventosTimeline,
          sem afetar o dimensionamento da grid. */}
      <div
        className={`static md:absolute md:inset-0 h-full md:h-auto origin-bottom flex flex-col rounded-sm overflow-hidden bg-[#f8f0d9] shadow-[0_18px_35px_rgba(0,0,0,100)] transition-all duration-500 ease-out md:group-hover:z-30 md:group-hover:-inset-x-[14%] md:group-hover:top-auto md:group-hover:shadow-[0_28px_55px_rgba(0,0,0,100)] ${rotate} ${hoverRotate}`}
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
              visuais, sem onClick. A seleção de cor/tamanho já é real
              (estado local do card), só não alimenta nenhum carrinho. */}
          {produto.disponivel && (
            <div className="grid grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
              <div className="overflow-hidden">
                <div className="flex flex-col gap-1.5 pt-2">
                  {temOpcoes && (
                    <div className="flex items-center justify-center gap-1.5 flex-wrap pb-0.5">
                      {produto.cores?.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          title={cor}
                          onClick={() => setCorSelecionada(cor)}
                          className={`w-5 h-5 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform ${
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
                          onClick={() => setTamanhoSelecionado(tam)}
                          className={`h-6 px-2.5 flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
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
                  <button className="w-full rounded-full border border-black/30 text-black/80 text-[11px] font-bold uppercase tracking-wide py-1.5 hover:bg-black/85 hover:text-white hover:border-black/85 transition-colors cursor-pointer">
                    Adicionar ao carrinho
                  </button>
                  <button className="w-full rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wide py-1.5 hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">
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
  return (
    <div className="w-full mx-auto flex-1 min-h-0 overflow-y-auto overflow-x-hidden md:overflow-visible p-3 md:p-16 grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-8 content-start">
      {produtos.map((produto, i) => (
        <ProdutoCard key={produto.id} produto={produto} index={i} />
      ))}
    </div>
  );
}
