import produtosData from "@/data/produtos.json";

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
  pasta: string;
  capa: string;
  fotos: string[];
  tamanhos?: string[];
  cores?: string[];
}

const produtos = produtosData as Produto[];

export function getProdutos(): Produto[] {
  return produtos;
}

export function getProdutoById(id: string): Produto | undefined {
  return produtos.find((p) => p.id === id);
}

export function formatarPreco(preco: number): string {
  return `${preco.toFixed(2).replace(".", ",")}€`;
}
