// Integração com a API do Quotagest (gestão de sócios) — só leitura.
// Credencial única e partilhada da associação (não é por utilizador), por
// isso este módulo só pode ser chamado a partir de código server-side
// (Server Components / Server Actions), nunca exposto ao cliente.

const BASE_URL = "https://www.app.quotagest.pt/api";

// Cache do token em memória do processo — evita um login por cada pedido.
// Reaproveitado entre invocações "quentes" (Fluid Compute); se tiver
// expirado do lado do Quotagest, o 401 em fetchAuthed força um novo login.
let cachedToken: string | null = null;

async function login(): Promise<string> {
  const email = process.env.QUOTAGEST_API_EMAIL;
  const password = process.env.QUOTAGEST_API_PASSWORD;
  if (!email || !password) {
    throw new Error("QUOTAGEST_API_EMAIL / QUOTAGEST_API_PASSWORD não configurados");
  }

  const res = await fetch(`${BASE_URL}/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Quotagest: login falhou (${res.status})`);

  const body = await res.json();
  if (!body?.token) throw new Error("Quotagest: resposta de login sem token");
  return body.token as string;
}

async function fetchAuthed(path: string, retrying = false): Promise<Response> {
  cachedToken ??= await login();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "auth-token": cachedToken },
  });

  if (res.status === 401 && !retrying) {
    cachedToken = null;
    return fetchAuthed(path, true);
  }

  return res;
}

export type QuotagestSocio = {
  /** id interno do Quotagest — guardar em users.quotagestId para pesquisas futuras diretas */
  id: string;
  nome: string;
  email: string;
  /** formato "YYYY-MM-DD", como devolvido pela API */
  dataEntrada: string | null;
  estado: string;
  quotaEmDia: boolean;
  /** valor em dívida, em euros — 0 quando quotaEmDia é true */
  divida: number;
  /** número de sócio — null para fundadores (ver tipo) */
  numeroSocio: string | null;
  /** "Efectivo" | "Fundador", tal como o Quotagest descreve */
  tipo: string;
  nif: string;
  /** null quando o campo está vazio no Quotagest (a maioria dos sócios nunca preencheu) */
  grupoSanguineo: string | null;
  /**
   * Referência Multibanco da cota pendente mais próxima, se o Quotagest já
   * a tiver gerado — nem toda cota por pagar tem uma (ver auditoria em
   * memória: só quando alguém no Quotagest a gerou manualmente). null
   * quando quotaEmDia é true, ou quando ainda não há referência emitida.
   */
  referenciaPendente: { entidade: string; referencia: string; valor: number; descricao: string } | null;
  /**
   * Descrição de cada item pendente (campo `descricao` do Quotagest, ex.
   * "Anual", "Donativo teste") — pode não ser sempre uma quota (ver
   * auditoria 2026-08-12: um "Donativo" de teste do Sr. Joaquim ficou por
   * liquidar e apareceu aqui). Mostrado ao sócio em vez de assumir "quota".
   */
  descricoesPendentes: string[];
};

type QuotagestSocioRow = {
  id: string;
  nome: string;
  email: string;
  /** número de sócio — só atribuído a quem entrou depois dos fundadores, ver has_codigo */
  codigo: string;
  has_codigo: boolean;
  tipo_descricao: string;
  nif: string;
  data_entrada: string | null;
  estado_descricao: string;
  has_divida: boolean;
  divida: string;
  saude_gruposangue: string;
};

function mapSocio(row: QuotagestSocioRow): QuotagestSocio {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    dataEntrada: row.data_entrada,
    estado: row.estado_descricao,
    // Valor inicial vindo de /socios — pode estar desatualizado (ver
    // withDividaReal abaixo), fica só como fallback se essa chamada falhar.
    quotaEmDia: !row.has_divida,
    divida: Number(row.divida) || 0,
    numeroSocio: row.has_codigo ? row.codigo : null,
    tipo: row.tipo_descricao,
    nif: row.nif,
    grupoSanguineo: row.saude_gruposangue?.trim() || null,
    referenciaPendente: null,
    descricoesPendentes: [],
  };
}

type QuotagestQuotaRow = {
  id: number;
  descricao: string;
  montante: string;
  total_divida: string;
  refmb_entidade: string | null;
  refmb_referencia: string | null;
};

// /socios devolve has_divida/divida como um valor calculado à parte pelo
// Quotagest — não é recalculado automaticamente assim que uma cota nova é
// emitida (existe um endpoint próprio no Quotagest, PUT
// /quotas/actualizar-dividas, para forçar esse recálculo manualmente).
// Por isso lemos aqui as cotas por pagar diretamente, que refletem sempre
// a realidade sem depender desse passo.
async function getQuotasPendentes(idSocio: string): Promise<QuotagestQuotaRow[]> {
  const res = await fetchAuthed(`/quotas?id_socio=${idSocio}&liquidado=0`);
  // O Quotagest devolve 400 (não um array vazio) quando o sócio não tem
  // nenhuma cota por pagar — confirmado em auditoria anterior contra a API
  // real. Trata-se como "sem dívida", não como erro.
  if (res.status === 400) return [];
  if (!res.ok) throw new Error(`Quotagest: /quotas falhou (${res.status})`);
  const body = await res.json();
  return body?.rows ?? [];
}

async function withDividaReal(socio: QuotagestSocio): Promise<QuotagestSocio> {
  try {
    const pendentes = await getQuotasPendentes(socio.id);
    const divida = pendentes.reduce((soma, q) => soma + (Number(q.total_divida) || Number(q.montante) || 0), 0);
    // Mostra a referência da primeira cota pendente que já tenha uma —
    // normalmente só há uma cota em dívida de cada vez, mas se houver mais
    // do que uma, a UI só precisa de uma referência para o sócio pagar já.
    const comReferencia = pendentes.find((q) => q.refmb_entidade && q.refmb_referencia);
    const referenciaPendente = comReferencia
      ? {
          entidade: comReferencia.refmb_entidade!,
          referencia: comReferencia.refmb_referencia!,
          valor: Number(comReferencia.total_divida) || Number(comReferencia.montante) || 0,
          descricao: comReferencia.descricao,
        }
      : null;
    const descricoesPendentes = [...new Set(pendentes.map((q) => q.descricao))];
    return { ...socio, quotaEmDia: pendentes.length === 0, divida, referenciaPendente, descricoesPendentes };
  } catch {
    // Falha suave — mantém o valor (possivelmente desatualizado) vindo de
    // /socios em vez de rebentar a secção "Sócio" do /perfil.
    return socio;
  }
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// A associação tem ~120 sócios — um único pedido com limit alto traz a
// lista inteira, mais simples e barato do que paginar ou confiar num
// endpoint de pesquisa/por-id cuja forma de resposta não testámos.
async function getSocios(): Promise<QuotagestSocioRow[]> {
  const res = await fetchAuthed("/socios?order=codigo&orderby=ASC&limit=500");
  if (!res.ok) throw new Error(`Quotagest: /socios falhou (${res.status})`);

  const body = await res.json();
  return body?.rows ?? [];
}

export async function getSocioByEmail(email: string): Promise<QuotagestSocio | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await getSocios();
  const match = rows.find((row) => row.email?.trim().toLowerCase() === normalized);
  return match ? withDividaReal(mapSocio(match)) : null;
}

export async function getSocioById(quotagestId: string): Promise<QuotagestSocio | null> {
  const rows = await getSocios();
  const match = rows.find((row) => row.id === quotagestId);
  return match ? withDividaReal(mapSocio(match)) : null;
}

// Fallback manual — um único campo de pesquisa serve para número de sócio
// (código) ou NIF, já que os fundadores não têm código atribuído (só NIF).
export async function findSocioByCodigoOuNif(query: string): Promise<QuotagestSocio | null> {
  const trimmed = query.trim();
  const digits = onlyDigits(trimmed);
  if (!digits) return null;

  const rows = await getSocios();
  const match = rows.find(
    (row) => (row.has_codigo && row.codigo === digits) || row.nif === digits
  );
  return match ? withDividaReal(mapSocio(match)) : null;
}
