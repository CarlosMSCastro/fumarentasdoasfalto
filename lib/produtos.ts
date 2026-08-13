import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { produtos, produtoFotos } from "@/lib/db/schema";

export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  // Euros (float) — mesma unidade que o resto do site já usa (formatarPreco,
  // carrinho, checkout); a BD guarda precoCentimos (inteiro), a conversão é
  // feita aqui para não obrigar a tocar em LojaGrid/CartSheet/checkout.
  preco: number;
  disponivel: boolean;
  capaUrl: string;
  fotos: string[];
  tamanhos?: string[] | null;
  cores?: string[] | null;
};

type ProdutoRow = typeof produtos.$inferSelect;

async function comFotos(linhas: ProdutoRow[]): Promise<Produto[]> {
  if (linhas.length === 0) return [];
  const fotos = await db
    .select()
    .from(produtoFotos)
    .where(inArray(produtoFotos.produtoId, linhas.map((p) => p.id)))
    .orderBy(asc(produtoFotos.ordem));
  return linhas.map((p) => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    descricao: p.descricao,
    preco: p.precoCentimos / 100,
    disponivel: p.disponivel,
    capaUrl: p.capaUrl,
    fotos: fotos.filter((f) => f.produtoId === p.id).map((f) => f.url),
    tamanhos: p.tamanhos,
    cores: p.cores,
  }));
}

// Devolve todos, disponíveis ou não — a Loja já trata a indisponibilidade
// visualmente (overlay "Indisponível" em LojaGrid.tsx), mesmo comportamento
// de antes com o JSON estático.
export async function getProdutos(): Promise<Produto[]> {
  const linhas = await db.select().from(produtos).orderBy(asc(produtos.createdAt));
  return comFotos(linhas);
}

export async function getProdutoById(id: string): Promise<Produto | undefined> {
  const [linha] = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  if (!linha) return undefined;
  const [produto] = await comFotos([linha]);
  return produto;
}
