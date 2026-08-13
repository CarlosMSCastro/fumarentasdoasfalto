"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { produtos, produtoFotos } from "@/lib/db/schema";
import { exigirAdmin } from "@/lib/admin-auth";
import { validarFoto, carregarFoto, apagarFoto } from "@/lib/upload";

function revalidarProdutos() {
  revalidatePath("/admin/conteudo/produtos");
  revalidatePath("/loja");
}

// "cores"/"tamanhos" chegam do formulário como JSON.stringify de um array
// de strings (ver TagsInput em ProdutosAdminList.tsx) — null quando o
// checkbox "Tem cores?"/"Tem tamanhos?" está desmarcado, nunca um array
// vazio (mantém o mesmo shape do JSON original: campo ausente, não []).
function parseListaOpcional(valor: FormDataEntryValue | null): string[] | null {
  if (typeof valor !== "string" || !valor) return null;
  try {
    const lista = JSON.parse(valor);
    if (!Array.isArray(lista)) return null;
    const limpa = lista.map((v) => String(v).trim()).filter(Boolean);
    return limpa.length > 0 ? limpa : null;
  } catch {
    return null;
  }
}

function parsePreco(valor: FormDataEntryValue | null): number | null {
  const numero = Number(String(valor ?? "").trim().replace(",", "."));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// id gerado aqui (não defaultRandom() da BD) pelo mesmo motivo de
// Fundadores — o caminho no Blob precisa do id antes da linha existir. A
// primeira foto carregada é sempre a capa inicial.
export async function criarProdutoAdmin(formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!nome) return { error: "Indica o nome." };

  const preco = parsePreco(formData.get("preco"));
  if (preco === null) return { error: "Indica um preço válido." };

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const cores = parseListaOpcional(formData.get("cores"));
  const tamanhos = parseListaOpcional(formData.get("tamanhos"));

  const id = randomUUID();
  const fotoUrl = await carregarFoto(`produtos/${id}/${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);

  await db.insert(produtos).values({
    id,
    nome,
    categoria,
    descricao,
    precoCentimos: Math.round(preco * 100),
    disponivel: true,
    capaUrl: fotoUrl,
    cores,
    tamanhos,
  });
  await db.insert(produtoFotos).values({ produtoId: id, url: fotoUrl, ordem: 0 });

  revalidarProdutos();
  return {};
}

export async function atualizarProdutoAdmin(
  id: string,
  dados: { nome: string; categoria: string; descricao: string; preco: number; cores: string[] | null; tamanhos: string[] | null }
): Promise<{ error?: string }> {
  await exigirAdmin();

  const nome = dados.nome.trim();
  if (!nome) return { error: "Indica o nome." };
  if (!Number.isFinite(dados.preco) || dados.preco <= 0) return { error: "Indica um preço válido." };

  await db
    .update(produtos)
    .set({
      nome,
      categoria: dados.categoria.trim(),
      descricao: dados.descricao.trim(),
      precoCentimos: Math.round(dados.preco * 100),
      cores: dados.cores && dados.cores.length > 0 ? dados.cores : null,
      tamanhos: dados.tamanhos && dados.tamanhos.length > 0 ? dados.tamanhos : null,
    })
    .where(eq(produtos.id, id));

  revalidarProdutos();
  return {};
}

export async function definirDisponivelProdutoAdmin(id: string, disponivel: boolean): Promise<void> {
  await exigirAdmin();
  await db.update(produtos).set({ disponivel }).where(eq(produtos.id, id));
  revalidarProdutos();
}

export async function adicionarFotoProdutoAdmin(id: string, formData: FormData): Promise<{ error?: string }> {
  await exigirAdmin();

  const validacao = validarFoto(formData.get("foto"));
  if (validacao.erro !== null) return { error: validacao.erro };

  const [ultima] = await db
    .select({ ordem: produtoFotos.ordem })
    .from(produtoFotos)
    .where(eq(produtoFotos.produtoId, id))
    .orderBy(desc(produtoFotos.ordem))
    .limit(1);
  const ordem = (ultima?.ordem ?? -1) + 1;

  const url = await carregarFoto(`produtos/${id}/${Date.now()}-${validacao.ficheiro.name}`, validacao.ficheiro);
  await db.insert(produtoFotos).values({ produtoId: id, url, ordem });

  revalidarProdutos();
  return {};
}

// Mesmo padrão de apagarFotoEventoAdmin: recebe produtoId+url (não um id de
// produto_foto, que a lista pública nunca expõe), bloqueia apagar a última
// foto, reatribui a capa se a foto apagada era essa.
export async function apagarFotoProdutoAdmin(produtoId: string, url: string): Promise<{ error?: string }> {
  await exigirAdmin();

  const [foto] = await db
    .select()
    .from(produtoFotos)
    .where(and(eq(produtoFotos.produtoId, produtoId), eq(produtoFotos.url, url)))
    .limit(1);
  if (!foto) return {};

  const todas = await db.select().from(produtoFotos).where(eq(produtoFotos.produtoId, produtoId));
  if (todas.length <= 1) return { error: "Um produto precisa de ter pelo menos uma foto." };

  await db.delete(produtoFotos).where(eq(produtoFotos.id, foto.id));

  const [produto] = await db.select({ capaUrl: produtos.capaUrl }).from(produtos).where(eq(produtos.id, produtoId)).limit(1);
  if (produto?.capaUrl === foto.url) {
    const [restante] = await db
      .select()
      .from(produtoFotos)
      .where(eq(produtoFotos.produtoId, produtoId))
      .orderBy(asc(produtoFotos.ordem))
      .limit(1);
    if (restante) await db.update(produtos).set({ capaUrl: restante.url }).where(eq(produtos.id, produtoId));
  }

  await apagarFoto(foto.url);
  revalidarProdutos();
  return {};
}

export async function escolherCapaProdutoAdmin(produtoId: string, fotoUrl: string): Promise<{ error?: string }> {
  await exigirAdmin();

  const [foto] = await db
    .select()
    .from(produtoFotos)
    .where(and(eq(produtoFotos.produtoId, produtoId), eq(produtoFotos.url, fotoUrl)))
    .limit(1);
  if (!foto) return { error: "Foto inválida." };

  await db.update(produtos).set({ capaUrl: fotoUrl }).where(eq(produtos.id, produtoId));
  revalidarProdutos();
  return {};
}

export async function apagarProdutoAdmin(id: string): Promise<void> {
  await exigirAdmin();

  const fotos = await db.select({ url: produtoFotos.url }).from(produtoFotos).where(eq(produtoFotos.produtoId, id));
  await db.delete(produtos).where(eq(produtos.id, id));
  await Promise.all(fotos.map((f) => apagarFoto(f.url)));

  revalidarProdutos();
}
