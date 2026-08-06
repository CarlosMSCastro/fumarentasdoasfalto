"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface CartItem {
  produtoId: string;
  nome: string;
  preco: number;
  imagemSrc: string;
  cor?: string;
  tamanho?: string;
  quantidade: number;
}

const STORAGE_KEY = "fda-carrinho";

// Identidade de uma linha do carrinho: o mesmo produto com cor/tamanho
// diferentes conta como linhas separadas.
function chaveItem(item: Pick<CartItem, "produtoId" | "cor" | "tamanho">) {
  return `${item.produtoId}|${item.cor ?? ""}|${item.tamanho ?? ""}`;
}

interface CartContextValue {
  items: CartItem[];
  adicionar: (item: Omit<CartItem, "quantidade">, quantidade?: number) => void;
  remover: (chave: string) => void;
  atualizarQuantidade: (chave: string, quantidade: number) => void;
  limpar: () => void;
  chaveItem: typeof chaveItem;
  contagem: number;
  subtotal: number;
  sheetAberta: boolean;
  setSheetAberta: (aberta: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart tem de ser usado dentro de <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [sheetAberta, setSheetAberta] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Leitura do localStorage tem de ficar num efeito (não dá para ler no
    // render inicial sem desalinhar do HTML gerado no servidor, que nunca
    // tem acesso ao localStorage do browser).
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setItems(JSON.parse(guardado));
    } catch {
      // localStorage indisponível ou conteúdo corrompido — arranca com carrinho vazio.
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, carregado]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const mostrarToast = (mensagem: string) => {
    setToast(mensagem);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  };

  const adicionar: CartContextValue["adicionar"] = (item, quantidade = 1) => {
    const chave = chaveItem(item);
    setItems((atual) => {
      const existente = atual.find((i) => chaveItem(i) === chave);
      if (existente) {
        return atual.map((i) => (chaveItem(i) === chave ? { ...i, quantidade: i.quantidade + quantidade } : i));
      }
      return [...atual, { ...item, quantidade }];
    });
    mostrarToast(`${item.nome} adicionado ao carrinho`);
  };

  const remover: CartContextValue["remover"] = (chave) => {
    setItems((atual) => atual.filter((i) => chaveItem(i) !== chave));
  };

  const atualizarQuantidade: CartContextValue["atualizarQuantidade"] = (chave, quantidade) => {
    if (quantidade <= 0) {
      remover(chave);
      return;
    }
    setItems((atual) => atual.map((i) => (chaveItem(i) === chave ? { ...i, quantidade } : i)));
  };

  const limpar = () => setItems([]);

  const contagem = useMemo(() => items.reduce((soma, i) => soma + i.quantidade, 0), [items]);
  const subtotal = useMemo(() => items.reduce((soma, i) => soma + i.preco * i.quantidade, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, adicionar, remover, atualizarQuantidade, limpar, chaveItem, contagem, subtotal, sheetAberta, setSheetAberta }}
    >
      {children}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-100 rounded-full bg-black/85 text-[#f8f0d9] text-sm font-semibold px-5 py-2.5 shadow-lg transition-all duration-300 pointer-events-none ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {toast}
      </div>
    </CartContext.Provider>
  );
}
