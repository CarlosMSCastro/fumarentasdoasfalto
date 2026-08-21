import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conteudoTexto, paginaLegalSeccoes } from "@/lib/db/schema";

// Cópia atual do site — serve de seed inicial E de fallback em runtime: uma
// chave que ainda não exista na BD (nunca editada, ou apagada por engano)
// nunca fica em branco, só mostra este valor. Ver getTextos().
export const TEXTOS_PADRAO = {
  "home.hero.label": "Bem-vindo",
  "home.hero.titulo": "FUMARENTAS DO ASFALTO",
  "home.hero.descricao":
    "Uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.",
  "home.objetivos.label": "Os nossos",
  "home.objetivos.titulo": "Objetivos",
  "home.objetivos.descricao":
    "Somos uma associação dedicada a promover o amor pelas motorizadas através de eventos, encontros e passeios.",
  "sobre.label": "A nossa",
  "sobre.titulo": "HISTÓRIA",
  "sobre.paragrafo1":
    "Somos uma associação de apaixonados por motorizadas, principalmente antigas. Aberta a novos sócios e criadora de eventos.",
  "sobre.paragrafo2":
    "Nasceu o sonho a 15 de junho de 2024 e a associação foi criada a 29 de novembro de 2024. Foi criada por 14 amigos com o intuito de promover o convívio entre pessoas que gostem de veículos motorizados de duas rodas, principalmente motorizadas de fabrico nacional de 50cc. Contudo, a associação está recetiva a sócios que tenham outro tipo de motas ou mesmo que não tenham. A confraternização e a amizade são o lema desta associação.",
  "sobre.paragrafo3":
    "Mantenha-se atualizado sobre os nossos eventos e novidades, incluindo dicas e informações relevantes. Entre em contacto connosco e partilhe as suas sugestões e comentários.",
  "legal.termos.titulo": "Termos e Condições",
  "legal.privacidade.titulo": "Política de Privacidade",
  "legal.cookies.titulo": "Política de Cookies",
  // Usados no Navbar (ícones de redes sociais, todas as páginas) — valores
  // atuais como seed, para nada mudar até serem editados no admin.
  "social.facebook.url": "https://www.facebook.com/profile.php?id=61569646445995",
  "social.instagram.url": "https://www.instagram.com/fumarentas_do_asfalto/#",
} as const;

export type TextoChave = keyof typeof TEXTOS_PADRAO;

export async function getTextos(): Promise<Record<TextoChave, string>> {
  const rows = await db.select().from(conteudoTexto);
  const mapa = new Map(rows.map((r) => [r.chave, r.valor]));
  const resultado = {} as Record<TextoChave, string>;
  for (const chave of Object.keys(TEXTOS_PADRAO) as TextoChave[]) {
    resultado[chave] = mapa.get(chave) ?? TEXTOS_PADRAO[chave];
  }
  return resultado;
}

export type PaginaLegalId = "termos" | "privacidade" | "cookies";
export type SeccaoLegal = { id: string; ordem: number; subtitulo: string; corpo: string };

export async function getSeccoesLegais(pagina: PaginaLegalId): Promise<SeccaoLegal[]> {
  const rows = await db
    .select()
    .from(paginaLegalSeccoes)
    .where(eq(paginaLegalSeccoes.pagina, pagina))
    .orderBy(asc(paginaLegalSeccoes.ordem));
  return rows.map((r) => ({ id: r.id, ordem: r.ordem, subtitulo: r.subtitulo, corpo: r.corpo }));
}
