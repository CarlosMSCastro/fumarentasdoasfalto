"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

  const adicionar = useCallback<CartContextValue["adicionar"]>((item, quantidade = 1) => {
    const chave = chaveItem(item);
    setItems((atual) => {
      const existente = atual.find((i) => chaveItem(i) === chave);
      if (existente) {
        return atual.map((i) => (chaveItem(i) === chave ? { ...i, quantidade: i.quantidade + quantidade } : i));
      }
      return [...atual, { ...item, quantidade }];
    });
    setSheetAberta(true);
  }, []);

  const remover = useCallback<CartContextValue["remover"]>((chave) => {
    setItems((atual) => atual.filter((i) => chaveItem(i) !== chave));
  }, []);

  const atualizarQuantidade = useCallback<CartContextValue["atualizarQuantidade"]>(
    (chave, quantidade) => {
      if (quantidade <= 0) {
        remover(chave);
        return;
      }
      setItems((atual) => atual.map((i) => (chaveItem(i) === chave ? { ...i, quantidade } : i)));
    },
    [remover]
  );

  const limpar = useCallback(() => setItems([]), []);

  const contagem = useMemo(() => items.reduce((soma, i) => soma + i.quantidade, 0), [items]);
  const subtotal = useMemo(() => items.reduce((soma, i) => soma + i.preco * i.quantidade, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, adicionar, remover, atualizarQuantidade, limpar, chaveItem, contagem, subtotal, sheetAberta, setSheetAberta }),
    [items, adicionar, remover, atualizarQuantidade, limpar, contagem, subtotal, sheetAberta]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
