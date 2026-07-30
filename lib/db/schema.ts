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
