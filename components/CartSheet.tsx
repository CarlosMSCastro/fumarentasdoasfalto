"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatarPreco } from "@/lib/produtos";
import { PORTES_EUROS } from "@/lib/encomendas";

export default function CartSheet() {
  const { items, remover, atualizarQuantidade, chaveItem, subtotal, sheetAberta, setSheetAberta } = useCart();
  const portes = items.length > 0 ? PORTES_EUROS : 0;
  const total = subtotal + portes;

  return (
    <Sheet open={sheetAberta} onOpenChange={setSheetAberta}>
      <SheetContent
        side="right"
        overlayClassName="z-[90] bg-transparent supports-backdrop-filter:backdrop-blur-none"
        className="z-[90] data-[side=right]:w-[65%] data-[side=right]:sm:max-w-sm bg-black/95 backdrop-blur-md border-white/10 p-0 gap-0 [&>button]:text-orange-500 [&>button]:scale-150 [&>button]:stroke-3"
      >
        <SheetTitle className="sr-only">Carrinho</SheetTitle>
        <SheetDescription className="sr-only">Itens no carrinho de compras</SheetDescription>

        <div className="flex flex-col h-full">
          <div className="shrink-0 px-5 pt-6 pb-4 border-b border-white/10">
            <h2 className="text-[#f8f0d9] text-xl font-bold uppercase tracking-wide">Carrinho</h2>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/50 px-5 text-center">
              <ShoppingBag size={40} strokeWidth={1.5} />
              <p className="text-sm">O teu carrinho está vazio.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-6 pb-4 flex flex-col gap-4">
              {items.map((item) => {
                const chave = chaveItem(item);
                return (
                  <div key={chave} className="flex gap-3">
                    <div className="relative w-20 h-20 shrink-0 rounded-sm overflow-hidden bg-[#f8f0d9]">
                      <Image src={item.imagemSrc} alt={item.nome} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-[#f8f0d9] text-base font-semibold leading-tight line-clamp-2">{item.nome}</p>
                      {(item.cor || item.tamanho) && (
                        <p className="text-white/50 text-xs">{[item.cor, item.tamanho].filter(Boolean).join(" · ")}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => atualizarQuantidade(chave, item.quantidade - 1)}
                            aria-label="Diminuir quantidade"
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-white text-sm w-4 text-center">{item.quantidade}</span>
                          <button
                            onClick={() => atualizarQuantidade(chave, item.quantidade + 1)}
                            aria-label="Aumentar quantidade"
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-primary text-base font-bold">{formatarPreco(item.preco * item.quantidade)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => remover(chave)}
                      aria-label="Remover item"
                      className="shrink-0 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="shrink-0 px-5 py-4 border-t border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Subtotal</span>
                <span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Portes</span>
                <span>{formatarPreco(portes)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-[#f8f0d9] pt-1">
                <span>Total</span>
                <span>{formatarPreco(total)}</span>
              </div>
              <Link href="/checkout" onClick={() => setSheetAberta(false)}>
                <Button className="w-full mt-2 bg-primary hover:bg-[var(--primary-hover)] text-white font-bold uppercase tracking-widest cursor-pointer">
                  Finalizar compra
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
