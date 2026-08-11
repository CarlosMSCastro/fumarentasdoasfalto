"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { PORTES_EUROS } from "@/lib/encomendas";
import { getProdutoById } from "@/lib/produtos";
import { gerarReferenciaMultibanco, pedirPagamentoMbway, gerarLinkPagamentoCartao } from "@/lib/eupago";
import { sendReferenciaMultibanco } from "@/lib/email";

const MAX_QUANTIDADE_POR_ITEM = 20;

export interface ItemEncomenda {
  produtoId: string;
  // nome/preco vêm do carrinho no cliente só para o resumo visual do
  // checkout — nunca são usados para calcular o total. criarEncomenda
  // recalcula sempre os dois a partir de data/produtos.json (fonte da
  // verdade), senão bastava editar o localStorage para pagar o que se
  // quisesse por uma encomenda.
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
  // Número da conta MB WAY a usar no pedido de pagamento — separado do
  // "telefone" de contacto (podem ser diferentes, e o telefone de contacto
  // pode nem estar preenchido). Só obrigatório quando metodoPagamento é "mbway".
  telemovelMbway?: string;
}

export type EncomendaResultado =
  | { error: string }
  | { orderId: string; referenciaMb?: { entidade: string; referencia: string; valor: number }; redirectUrl?: string; pagamentoError?: string };

// idempotencyKey vem do cliente (um UUID por tentativa de checkout, ver
// CheckoutForm.tsx) — se já existir uma encomenda com esta chave, devolve-a
// tal como está em vez de criar outra e voltar a pedir pagamento à Eupago.
// Protege contra duplo clique/reenvio (ex. refresh a meio do pedido).
export async function criarEncomenda(
  itens: ItemEncomenda[],
  dados: DadosEncomenda,
  idempotencyKey: string
): Promise<EncomendaResultado> {
  if (!idempotencyKey.trim()) return { error: "Pedido inválido. Atualiza a página e tenta novamente." };

  const [existente] = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
  if (existente) {
    return {
      orderId: existente.id,
      referenciaMb:
        existente.referenciaMbEntidade && existente.referenciaMbNumero
          ? { entidade: existente.referenciaMbEntidade, referencia: existente.referenciaMbNumero, valor: existente.totalCentimos / 100 }
          : undefined,
    };
  }

  if (itens.length === 0) return { error: "O carrinho está vazio." };
  if (!dados.nome.trim()) return { error: "Indica o teu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) return { error: "Email inválido." };
  if (!dados.telefone.trim()) return { error: "Indica um contacto telefónico." };
  if (dados.metodoPagamento === "mbway" && !/^9\d{8}$/.test(dados.telemovelMbway?.trim() ?? "")) {
    return { error: "Indica um número MB WAY válido." };
  }

  // Recalcula cada item a partir do catálogo — nunca confiar no nome/preço
  // que vem do cliente (ver comentário em ItemEncomenda).
  const itensValidados: { produtoId: string; nome: string; preco: number; quantidade: number; cor?: string; tamanho?: string }[] = [];
  for (const item of itens) {
    const produto = getProdutoById(item.produtoId);
    if (!produto) return { error: "Um dos produtos do carrinho já não existe. Atualiza a página e tenta novamente." };
    if (!produto.disponivel) return { error: `"${produto.nome}" já não está disponível.` };

    const quantidade = Math.floor(item.quantidade);
    if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE_POR_ITEM) {
      return { error: `Quantidade inválida para "${produto.nome}".` };
    }
    if (item.cor && !produto.cores?.includes(item.cor)) return { error: `Cor inválida para "${produto.nome}".` };
    if (item.tamanho && !produto.tamanhos?.includes(item.tamanho)) return { error: `Tamanho inválido para "${produto.nome}".` };

    itensValidados.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, quantidade, cor: item.cor, tamanho: item.tamanho });
  }

  const session = await auth();
  const subtotal = itensValidados.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  const portes = PORTES_EUROS;
  const total = subtotal + portes;

  let encomenda: typeof orders.$inferSelect;
  try {
    [encomenda] = await db
      .insert(orders)
      .values({
        userId: session?.user?.id ?? null,
        idempotencyKey,
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
  } catch (erro) {
    // Corrida rara: dois pedidos com a mesma chave passaram a verificação
    // acima antes de qualquer um dos dois inserir — a constraint unique na
    // BD rejeita o segundo insert. Trata-se como "já existe", tal como a
    // verificação normal no topo da função.
    const [jaExiste] = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
    if (jaExiste) {
      return {
        orderId: jaExiste.id,
        referenciaMb:
          jaExiste.referenciaMbEntidade && jaExiste.referenciaMbNumero
            ? { entidade: jaExiste.referenciaMbEntidade, referencia: jaExiste.referenciaMbNumero, valor: jaExiste.totalCentimos / 100 }
            : undefined,
      };
    }
    throw erro;
  }

  await db.insert(orderItems).values(
    itensValidados.map((item) => ({
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    if (dados.metodoPagamento === "multibanco") {
      const ref = await gerarReferenciaMultibanco({ identificador: encomenda.id, valor: total, descricao });
      await db
        .update(orders)
        .set({ referenciaMbEntidade: ref.entidade, referenciaMbNumero: ref.referencia, eupagoIdentificador: encomenda.id })
        .where(eq(orders.id, encomenda.id));
      // Falha suave: a referência já está gerada e guardada — um erro a
      // enviar o email não deve fazer parecer que o pagamento falhou.
      await sendReferenciaMultibanco(dados.email.trim().toLowerCase(), {
        id: encomenda.id,
        entidade: ref.entidade,
        referencia: ref.referencia,
        valor: ref.valor,
      }).catch(() => null);
      return { orderId: encomenda.id, referenciaMb: { entidade: ref.entidade, referencia: ref.referencia, valor: ref.valor } };
    }
    if (dados.metodoPagamento === "mbway") {
      await pedirPagamentoMbway({ identificador: encomenda.id, valor: total, descricao, telemovel: dados.telemovelMbway!.trim() });
      await db.update(orders).set({ eupagoIdentificador: encomenda.id }).where(eq(orders.id, encomenda.id));
      return { orderId: encomenda.id };
    }
    const { url } = await gerarLinkPagamentoCartao({
      identificador: encomenda.id,
      valor: total,
      descricao,
      email: dados.email.trim().toLowerCase(),
      successUrl: `${baseUrl}/checkout/retorno?orderId=${encomenda.id}&estado=sucesso`,
      failUrl: `${baseUrl}/checkout/retorno?orderId=${encomenda.id}&estado=falha`,
      backUrl: `${baseUrl}/checkout`,
    });
    await db.update(orders).set({ eupagoIdentificador: encomenda.id }).where(eq(orders.id, encomenda.id));
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
