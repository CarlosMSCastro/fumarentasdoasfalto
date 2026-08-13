import { pgTable, pgEnum, text, timestamp, uuid, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const roleEnum = pgEnum("role", ["user", "admin"]);

// Tabela de utilizadores do Auth.js, estendida com role e os campos de morada
// que pré-preenchem o checkout da loja quando há sessão ativa.
export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("user"),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  addressLine: text("address_line"),
  postalCode: text("postal_code"),
  city: text("city"),
  // Preenchido depois de encontrarmos a correspondência no Quotagest (por
  // email automaticamente, ou por código/NIF inserido manualmente) — evita
  // ter de repetir a pesquisa a cada visita ao perfil.
  quotagestId: text("quotagest_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Liga cada user às identidades OAuth (Google/Facebook). Necessária mesmo só
// com Credentials, para permitir a mesma conta por email + Google + Facebook.
export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

// Usada para os links de "confirmar conta" / "definir password" (reutilizada
// para o onboarding dos sócios migrados do Wix). Não há tabela de sessions —
// o Credentials provider força estratégia de sessão JWT no Auth.js.
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// Pedido de alteração de email pendente de confirmação — precisa de guardar
// o email novo por utilizador (a verificationToken genérica só tem
// identifier+token, sem campo para "qual é o valor novo"), por isso é uma
// tabela à parte em vez de reaproveitar aquela.
export const emailChangeRequests = pgTable(
  "email_change_request",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    newEmail: text("new_email").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.token] })]
);

// Pedido de associação a um sócio do Quotagest pendente de confirmação —
// número de sócio/NIF não são segredo (são previsíveis/conhecidos dentro da
// associação), por isso a associação não pode ser imediata: fica pendente
// até o dono do email registado no Quotagest para esse sócio confirmar o
// link, senão davas para qualquer pessoa "roubar" o registo de sócio de
// outra. Tabela dedicada em vez da verificationToken genérica pelo mesmo
// motivo do emailChangeRequests acima — precisa de guardar qual é o
// quotagestId, não só um identifier+token.
export const socioLinkRequests = pgTable(
  "socio_link_request",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quotagestId: text("quotagest_id").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.token] })]
);

// "enviado" é o último estado do fluxo (sem API dos correios nem tracking,
// é o admin que marca à mão quando despacha) — ver painel /admin/encomendas.
export const orderStatusEnum = pgEnum("order_status", ["pendente", "pago", "cancelado", "expirado", "enviado"]);
export const metodoPagamentoEnum = pgEnum("metodo_pagamento", ["multibanco", "mbway", "cartao"]);
export const metodoEntregaEnum = pgEnum("metodo_entrega", ["envio", "levantamento"]);

// userId fica a null para compras de convidado — checkout não obriga login.
// Valores monetários em cêntimos (inteiro) para evitar erros de vírgula
// flutuante; os produtos em produtos.json continuam em euros (float), a
// conversão é feita ao criar a encomenda.
export const orders = pgTable("order", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone").notNull(),
  moradaLinha: text("morada_linha"),
  codigoPostal: text("codigo_postal"),
  cidade: text("cidade"),
  metodoPagamento: metodoPagamentoEnum("metodo_pagamento").notNull(),
  // "levantamento" zera os portes em criarEncomenda (app/actions/encomendas.ts)
  // — default "envio" só por causa de encomendas antigas, anteriores a esta
  // coluna existir (todas eram entregues por envio até aqui).
  metodoEntrega: metodoEntregaEnum("metodo_entrega").notNull().default("envio"),
  status: orderStatusEnum("status").notNull().default("pendente"),
  subtotalCentimos: integer("subtotal_centimos").notNull(),
  portesCentimos: integer("portes_centimos").notNull(),
  totalCentimos: integer("total_centimos").notNull(),
  // Gerada no cliente (um UUID por tentativa de checkout, guardado em
  // sessionStorage) e enviada a criarEncomenda — protege contra duplo clique
  // ou reenvio (ex. refresh a meio do pedido): um segundo pedido com a mesma
  // chave devolve a encomenda já criada em vez de criar outra e voltar a
  // pedir pagamento à Eupago. Nullable só por causa de encomendas antigas,
  // anteriores a esta coluna existir.
  idempotencyKey: text("idempotency_key").unique(),
  // Preenchidos depois de pedir a referência/pagamento ao Eupago — ver
  // lib/eupago.ts. eupagoIdentificador é o que liga o callback do Eupago a
  // esta encomenda (referência interna que enviamos no pedido).
  referenciaMbEntidade: text("referencia_mb_entidade"),
  referenciaMbNumero: text("referencia_mb_numero"),
  eupagoIdentificador: text("eupago_identificador"),
  // Preenchido à mão pelo admin ao marcar "Enviado" (sem API de
  // transportadora — ver marcarEnviadoAdmin em app/actions/admin.ts).
  // Opcional: nem todos os envios têm rastreio (ex. correio normal sem
  // registo), por isso nunca é obrigatório nem inventado.
  codigoRastreio: text("codigo_rastreio"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});

// produtoId refere-se ao id na tabela produto, mas não é uma FK de propósito
// — nome e preco são um snapshot do momento da compra (para a encomenda não
// mudar se o produto for depois editado/apagado), e um produto apagado não
// deve arrastar as encomendas antigas que o referenciam.
export const orderItems = pgTable("order_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  produtoId: text("produto_id").notNull(),
  nome: text("nome").notNull(),
  precoCentimos: integer("preco_centimos").notNull(),
  quantidade: integer("quantidade").notNull(),
  cor: text("cor"),
  tamanho: text("tamanho"),
});

// Uma linha por secção do painel — timestamp de "a última vez que um admin
// visitou esta secção", usado para calcular badges de "N novos" no ecrã
// inicial do /admin (ver lib/admin-notificacoes.ts). Um marcador global (não
// por admin) de propósito: há tipicamente 1-2 admins, e "visto por um" já
// resolve a notificação para efeitos práticos — não vale a pena um sistema
// de leitura por utilizador para isto.
export const adminSecaoEnum = pgEnum("admin_secao", ["encomendas", "socios", "utilizadores"]);

export const adminSecoesVistas = pgTable("admin_secao_vista", {
  secao: adminSecaoEnum("secao").primaryKey(),
  vistaEm: timestamp("vista_em", { mode: "date" }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// CMS de conteúdo (sem Sanity — ver plano de implementação). Substitui
// data/*.json e texto hardcoded por tabelas geridas em /admin/conteudo.
// ---------------------------------------------------------------------------

export const fundadores = pgTable("fundador", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull(),
  fotoUrl: text("foto_url").notNull(),
  // Ordem de exibição — sem UI de reordenar por agora, novos entram no fim
  // (maior ordem existente + 1).
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// 3 linhas fixas (uma por card dos Objetivos) — nunca criadas/apagadas pelo
// admin, só a fotoUrl é editável. Ver ObjetivosDesktop.tsx/ObjetivosMobile.tsx.
export const objetivoCardIdEnum = pgEnum("objetivo_card_id", ["encontros", "restauracao", "workshops"]);

export const objetivoFotos = pgTable("objetivo_foto", {
  cardId: objetivoCardIdEnum("card_id").primaryKey(),
  fotoUrl: text("foto_url").notNull(),
});

// Texto simples da homepage/sobre — key-value de propósito: o conjunto de
// strings cresce ad hoc (mais um parágrafo, um label novo) sem precisar de
// migration nenhuma, só uma chave nova em TEXTOS_PADRAO (lib/textos.ts), que
// serve de seed inicial E de fallback em runtime para qualquer chave que
// ainda não tenha sido migrada/gravada.
export const conteudoTexto = pgTable("conteudo_texto", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
});

// Páginas legais precisam de adicionar/remover secções inteiras (não só
// editar texto existente) — por isso não cabem no key-value acima. Uma linha
// por secção, ordenada, por página.
export const paginaLegalEnum = pgEnum("pagina_legal", ["termos", "privacidade", "cookies"]);

export const paginaLegalSeccoes = pgTable("pagina_legal_seccao", {
  id: uuid("id").defaultRandom().primaryKey(),
  pagina: paginaLegalEnum("pagina").notNull(),
  ordem: integer("ordem").notNull().default(0),
  subtitulo: text("subtitulo").notNull(),
  corpo: text("corpo").notNull(),
});

// id continua texto (slug), não uuid — preserva as URLs /eventos/[id] já
// existentes/partilhadas (ver data/eventos.json, ids tipo "aniversario-1").
export const eventos = pgTable("evento", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  local: text("local").notNull(),
  // Formato "YYYY-MM-DD" (ou "YYYY-MM"), como o JSON original — mesmo shape
  // que mesDe()/formatarDataCompleta() em lib/eventos.ts já esperam.
  data: text("data").notNull(),
  descricao: text("descricao").notNull().default(""),
  // Migrado 1:1 do JSON, sem UI de edição no admin (fora do âmbito pedido) —
  // controla o tamanho maior na timeline para eventos-marco.
  destaque: boolean("destaque").notNull().default(false),
  // Novo — toggle "mostrar/não mostrar" pedido. false esconde tanto da
  // timeline como da própria página /eventos/[id] (ver lib/eventos.ts).
  mostrar: boolean("mostrar").notNull().default(true),
  capaUrl: text("capa_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const eventoFotos = pgTable("evento_foto", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventoId: text("evento_id")
    .notNull()
    .references(() => eventos.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  ordem: integer("ordem").notNull().default(0),
});

// Sem rota própria (loja não tem /loja/[id]) — uuid chega, não precisa de
// slug bonito. cores/tamanhos ficam null quando o produto não tem essa
// variante (mesmo shape do data/produtos.json atual) — sem tabela de
// stock/SKU por variante, o checkout nunca teve isso, só disponivel a nível
// de produto.
export const produtos = pgTable("produto", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  // Texto livre — confirmado por grep que não filtra/agrupa nada na UI hoje.
  categoria: text("categoria").notNull().default(""),
  descricao: text("descricao").notNull().default(""),
  precoCentimos: integer("preco_centimos").notNull(),
  // Toggle "esgotado" = inverter isto.
  disponivel: boolean("disponivel").notNull().default(true),
  capaUrl: text("capa_url").notNull(),
  cores: text("cores").array(),
  tamanhos: text("tamanhos").array(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const produtoFotos = pgTable("produto_foto", {
  id: uuid("id").defaultRandom().primaryKey(),
  produtoId: uuid("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  ordem: integer("ordem").notNull().default(0),
});

// Pagamento de quota pelo próprio sócio em /perfil — não é uma encomenda
// (sem itens/morada/entrega), por isso tabela própria em vez de reaproveitar
// "orders". Usa o canal Eupago da Loja (gerarReferenciaMultibanco/
// pedirPagamentoMbway, lib/eupago.ts) — nunca o do Quotagest, que tem
// problemas conhecidos (referências nem sempre emitidas, webhook deles não
// está ativo). O registo como paga no Quotagest continua manual, feito pelo
// Sr. Joaquim — só a cobrança em si passa a ser fiável.
export const quotaPagamentoStatusEnum = pgEnum("quota_pagamento_status", ["pendente", "pago", "cancelado", "expirado"]);

export const quotaPagamentos = pgTable("quota_pagamento", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quotagestId: text("quotagest_id").notNull(),
  // Snapshot do momento do pedido — nome como consta no Quotagest (para o
  // Sr. Joaquim identificar o sócio), email da conta (para onde vai a
  // confirmação, pode não ser o mesmo que o Quotagest tem registado).
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  // Sempre = dívida do sócio no momento do pedido, nunca escolhido pelo
  // cliente (ver pedirPagamentoQuota em app/actions/quota.ts).
  valorCentimos: integer("valor_centimos").notNull(),
  // Reaproveita metodoPagamentoEnum — só "multibanco"/"mbway" são usados
  // aqui, mas não vale a pena um enum novo só para excluir "cartao".
  metodoPagamento: metodoPagamentoEnum("metodo_pagamento").notNull(),
  status: quotaPagamentoStatusEnum("status").notNull().default("pendente"),
  referenciaMbEntidade: text("referencia_mb_entidade"),
  referenciaMbNumero: text("referencia_mb_numero"),
  telemovelMbway: text("telemovel_mbway"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});
