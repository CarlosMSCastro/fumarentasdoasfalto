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
    quotaEmDia: !row.has_divida,
    divida: Number(row.divida) || 0,
    numeroSocio: row.has_codigo ? row.codigo : null,
    tipo: row.tipo_descricao,
    nif: row.nif,
    grupoSanguineo: row.saude_gruposangue?.trim() || null,
  };
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
  return match ? mapSocio(match) : null;
}

export async function getSocioById(quotagestId: string): Promise<QuotagestSocio | null> {
  const rows = await getSocios();
  const match = rows.find((row) => row.id === quotagestId);
  return match ? mapSocio(match) : null;
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
  return match ? mapSocio(match) : null;
}
