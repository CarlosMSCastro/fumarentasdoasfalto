"use client";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { getProdutos, formatarPreco, type Produto } from "@/lib/produtos";

const produtos = getProdutos();

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

export default function LojaGrid() {
  return (
    <div className="w-full mx-auto flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 md:p-4 grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 content-start">
      {produtos.map((produto, i) => {
        const rotate = i % 2 === 0 ? "-rotate-2" : "rotate-1.5";
        const hoverRotate = i % 2 === 0 ? "group-hover:rotate-2" : "group-hover:-rotate-1.5";

        return (
          <div
            key={produto.id}
            className={`group relative flex flex-col min-h-36 md:min-h-0 rounded-sm overflow-hidden bg-[#f8f0d9] shadow-[0_18px_35px_rgba(0,0,0,100)] transition-all duration-700 ease-out hover:z-10 ${rotate} ${hoverRotate}`}
          >
            <div className="relative aspect-square m-2 overflow-hidden rounded-sm">
              <ProdutoImagem produto={produto} />
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
              {!produto.disponivel && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                  <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wide">Indisponível</span>
                </div>
              )}
              {/* Carrinho/checkout ainda não existem — botões só de momento
                  visuais, sem onClick. Só no desktop (md:group-hover),
                  porque não há :hover real em touch. */}
              {produto.disponivel && (
                <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-2 px-3">
                  <button className="w-full rounded-full border border-white text-white text-[11px] font-bold uppercase tracking-wide py-1.5 hover:bg-white hover:text-black transition-colors cursor-pointer">
                    Adicionar ao carrinho
                  </button>
                  <button className="w-full rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wide py-1.5 hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">
                    Comprar agora
                  </button>
                </div>
              )}
            </div>
            <div className="shrink-0 px-2 pb-1.5 pt-1 text-center">
              <p className="text-black/85 font-bold uppercase leading-tight text-sm md:text-base truncate">
                {produto.nome}
              </p>
              <p className="text-primary font-bold text-sm md:text-base">{formatarPreco(produto.preco)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
