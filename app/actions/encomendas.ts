"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { PORTES_EUROS } from "@/lib/encomendas";
import { gerarReferenciaMultibanco, pedirPagamentoMbway, gerarLinkPagamentoCartao } from "@/lib/eupago";

export interface ItemEncomenda {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  cor?: string;
  tamanho?: string;
}

export interface DadosEncomenda {
  nome: string;
  email: string;
  telefone: string;
  moradaLinha?: string;
  codigoPostal?: string;
  cidade?: string;
  metodoPagamento: "multibanco" | "mbway" | "cartao";
}

export type EncomendaResultado =
  | { error: string }
  | { orderId: string; referenciaMb?: { entidade: string; referencia: string }; redirectUrl?: string; pagamentoError?: string };

export async function criarEncomenda(itens: ItemEncomenda[], dados: DadosEncomenda): Promise<EncomendaResultado> {
  if (itens.length === 0) return { error: "O carrinho está vazio." };
  if (!dados.nome.trim()) return { error: "Indica o teu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) return { error: "Email inválido." };
  if (!dados.telefone.trim()) return { error: "Indica um contacto telefónico." };
  if (dados.metodoPagamento === "mbway" && !/^9\d{8}$/.test(dados.telefone.trim())) {
    return { error: "Para MBWAY, indica um número de telemóvel português válido." };
  }

  const session = await auth();
  const subtotal = itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  const portes = PORTES_EUROS;
  const total = subtotal + portes;

  const [encomenda] = await db
    .insert(orders)
    .values({
      userId: session?.user?.id ?? null,
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      telefone: dados.telefone.trim(),
      moradaLinha: dados.moradaLinha?.trim() || null,
      codigoPostal: dados.codigoPostal?.trim() || null,
      cidade: dados.cidade?.trim() || null,
      metodoPagamento: dados.metodoPagamento,
      subtotalCentimos: Math.round(subtotal * 100),
      portesCentimos: Math.round(portes * 100),
      totalCentimos: Math.round(total * 100),
    })
    .returning();

  await db.insert(orderItems).values(
    itens.map((item) => ({
      orderId: encomenda.id,
      produtoId: item.produtoId,
      nome: item.nome,
      precoCentimos: Math.round(item.preco * 100),
      quantidade: item.quantidade,
      cor: item.cor || null,
      tamanho: item.tamanho || null,
    }))
  );

  const descricao = `Encomenda Fumarentas do Asfalto #${encomenda.id.slice(0, 8)}`;

  try {
    if (dados.metodoPagamento === "multibanco") {
      const ref = await gerarReferenciaMultibanco({ identificador: encomenda.id, valor: total, descricao });
      await db
        .update(orders)
        .set({ referenciaMbEntidade: ref.entidade, referenciaMbNumero: ref.referencia })
        .where(eq(orders.id, encomenda.id));
      return { orderId: encomenda.id, referenciaMb: { entidade: ref.entidade, referencia: ref.referencia } };
    }
    if (dados.metodoPagamento === "mbway") {
      await pedirPagamentoMbway({ identificador: encomenda.id, valor: total, descricao, telemovel: dados.telefone.trim() });
      return { orderId: encomenda.id };
    }
    const { url } = await gerarLinkPagamentoCartao({ identificador: encomenda.id, valor: total, descricao });
    return { orderId: encomenda.id, redirectUrl: url };
  } catch (erro) {
    // A encomenda fica registada como pendente mesmo que o pagamento não
    // tenha arrancado (Eupago ainda não configurado — ver lib/eupago.ts).
    // Não falha a criação da encomenda por causa disto.
    return {
      orderId: encomenda.id,
      pagamentoError: erro instanceof Error ? erro.message : "Não foi possível iniciar o pagamento.",
    };
  }
}
