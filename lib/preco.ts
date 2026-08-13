// Função pura (sem ligação à BD) — separada de lib/produtos.ts de propósito,
// porque esse ficheiro agora tem "server-only" e vários client components
// (LojaGrid, CartSheet, CheckoutForm, PerfilForm, os admin *AdminList) só
// precisam disto, nunca de ir buscar produtos à BD.
export function formatarPreco(preco: number): string {
  return `${preco.toFixed(2).replace(".", ",")}€`;
}
