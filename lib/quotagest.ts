// Integração com a API do Quotagest (gestão de sócios). Maioritariamente só
// leitura — a exceção é atualizarSocio, para o painel de admin poder
// corrigir dados de contacto (ver comentário lá). Credencial única e
// partilhada da associação (não é por utilizador), por isso este módulo só
// pode ser chamado a partir de código server-side (Server Components /
// Server Actions), nunca exposto ao cliente.

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

async function fetchAuthed(path: string, init?: RequestInit, retrying = false): Promise<Response> {
  cachedToken ??= await login();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, "auth-token": cachedToken },
  });

  if (res.status === 401 && !retrying) {
    cachedToken = null;
    return fetchAuthed(path, init, true);
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
  // Campos de contacto editáveis pelo painel de admin (ver atualizarSocio) —
  // confirmados presentes no mesmo GET /socios já usado para a lista, sem
  // pedido extra por sócio.
  telefone: string | null;
  telemovel: string | null;
  morada: string | null;
  codigoPostal: string | null;
  /** formato "YYYY-MM-DD", como devolvido pela API */
  dataNascimento: string | null;
  /** URL pública (storage.quotagest.pt) — null quando o sócio não tem foto carregada */
  fotografiaUrl: string | null;
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
  telefone: string | null;
  telemovel: string | null;
  morada: string | null;
  codigo_postal: string | null;
  data_nascimento: string | null;
  hasfotografia: boolean;
  fotografia_url: string | null;
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
    telefone: row.telefone,
    telemovel: row.telemovel,
    morada: row.morada,
    codigoPostal: row.codigo_postal,
    dataNascimento: row.data_nascimento,
    fotografiaUrl: row.hasfotografia ? row.fotografia_url : null,
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

// Para a lista do painel de admin (/admin/socios) — usa só o has_divida/
// divida devolvido por /socios (ver mapSocio), sem o withDividaReal por
// sócio, que faria ~120 pedidos extra ao Quotagest de cada vez que a página
// carregasse. O valor pode estar ligeiramente desatualizado (ver comentário
// em mapSocio), aceitável para uma vista geral — o /perfil de cada sócio
// continua a mostrar o valor exato via withDividaReal.
export async function getTodosSocios(): Promise<QuotagestSocio[]> {
  const rows = await getSocios();
  return rows.map(mapSocio);
}

// O Quotagest não garante um email preenchido/válido em todos os sócios
// (registos antigos podem ter o campo em branco) — usado por
// /admin/comunicados para nunca tentar enviar para um endereço inútil.
export function filtrarSociosComEmailValido(socios: QuotagestSocio[]): {
  validos: QuotagestSocio[];
  invalidos: QuotagestSocio[];
} {
  const validos: QuotagestSocio[] = [];
  const invalidos: QuotagestSocio[] = [];
  for (const s of socios) {
    (s.email && s.email.includes("@") ? validos : invalidos).push(s);
  }
  return { validos, invalidos };
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

export type AtualizarSocioInput = {
  nome: string;
  email: string;
  nif: string;
  telefone: string | null;
  telemovel: string | null;
  morada: string | null;
  codigoPostal: string | null;
  dataNascimento: string | null;
};

// Único endpoint de escrita deste módulo — âmbito deliberadamente limitado
// aos campos de contacto/identificação (o utilizador confirmou que editar
// isto diretamente no Quotagest não é problema). Nunca toca em id_tipo/
// id_estado (afetam a lógica de quotas, e os IDs válidos não estão
// mapeados) nem em codigo (número de sócio, a identidade dele no
// Quotagest) — essas alterações ficam só no backoffice do Quotagest.
// Envia sempre o conjunto completo destes campos, não só os alterados: o
// formulário no painel pré-preenche com os valores atuais (confirmados
// presentes no GET /socios), para um PUT não apagar sem querer um campo que
// o admin não tocou.
export async function atualizarSocio(id: string, dados: AtualizarSocioInput): Promise<void> {
  const res = await fetchAuthed(`/socios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      nif: dados.nif,
      telefone: dados.telefone,
      telemovel: dados.telemovel,
      morada: dados.morada,
      codigo_postal: dados.codigoPostal,
      data_nascimento: dados.dataNascimento,
    }),
  });
  if (!res.ok) throw new Error(`Quotagest: PUT /socios/${id} falhou (${res.status})`);
}

type QuotagestMovimentoRow = {
  id_socio: string;
  total_pago: string;
  montante: string;
  ano: number;
};

export type EstatisticasFinanceiras = {
  totalPagoAno: number;
  totalPagoHistorico: number;
  totalEmDivida: number;
  numeroSociosEmDivida: number;
};

// Confirmado ao vivo (2026-08-13): /quotas não precisa de id_socio — dá para
// pedir os movimentos da associação toda de uma vez, em vez de um pedido por
// sócio (o que seria ~240 pedidos extra ao Quotagest de cada vez que o
// painel carregasse). limit alto pelo mesmo motivo que getSocios (mais
// simples e barato do que paginar).
export async function getEstatisticasFinanceiras(): Promise<EstatisticasFinanceiras> {
  const anoAtual = new Date().getFullYear();

  const [resPagas, resPendentes] = await Promise.all([
    fetchAuthed("/quotas?liquidado=1&limit=1000"),
    fetchAuthed("/quotas?liquidado=0&limit=1000"),
  ]);
  if (!resPagas.ok) throw new Error(`Quotagest: /quotas?liquidado=1 falhou (${resPagas.status})`);
  // Mesmo comportamento de /quotas?id_socio=X&liquidado=0 (ver
  // getQuotasPendentes) — 400 quando não há nenhuma cota por pagar em toda a
  // associação, não um array vazio.
  const linhasPendentes: QuotagestMovimentoRow[] =
    resPendentes.status === 400 ? [] : resPendentes.ok ? ((await resPendentes.json())?.rows ?? []) : [];
  if (!resPendentes.ok && resPendentes.status !== 400) {
    throw new Error(`Quotagest: /quotas?liquidado=0 falhou (${resPendentes.status})`);
  }

  const linhasPagas: QuotagestMovimentoRow[] = (await resPagas.json())?.rows ?? [];

  return {
    totalPagoHistorico: linhasPagas.reduce((soma, q) => soma + (Number(q.total_pago) || 0), 0),
    totalPagoAno: linhasPagas.filter((q) => q.ano === anoAtual).reduce((soma, q) => soma + (Number(q.total_pago) || 0), 0),
    totalEmDivida: linhasPendentes.reduce((soma, q) => soma + (Number(q.montante) || 0), 0),
    numeroSociosEmDivida: new Set(linhasPendentes.map((q) => q.id_socio)).size,
  };
}
