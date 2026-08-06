import { pgTable, pgEnum, text, timestamp, uuid, integer, primaryKey } from "drizzle-orm/pg-core";
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

export const orderStatusEnum = pgEnum("order_status", ["pendente", "pago", "cancelado", "expirado"]);
export const metodoPagamentoEnum = pgEnum("metodo_pagamento", ["multibanco", "mbway", "cartao"]);

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
  status: orderStatusEnum("status").notNull().default("pendente"),
  subtotalCentimos: integer("subtotal_centimos").notNull(),
  portesCentimos: integer("portes_centimos").notNull(),
  totalCentimos: integer("total_centimos").notNull(),
  // Preenchidos depois de pedir a referência/pagamento ao Eupago — ver
  // lib/eupago.ts. eupagoIdentificador é o que liga o callback do Eupago a
  // esta encomenda (referência interna que enviamos no pedido).
  referenciaMbEntidade: text("referencia_mb_entidade"),
  referenciaMbNumero: text("referencia_mb_numero"),
  eupagoIdentificador: text("eupago_identificador"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});

// produtoId refere-se ao id em produtos.json, não uma FK (os produtos vivem
// em ficheiro, não em BD — ver Content strategy no CLAUDE.md). nome e preco
// são um snapshot do momento da compra, para a encomenda não mudar se o
// produto for depois editado/removido do catálogo.
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
