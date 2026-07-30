import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  // O Credentials provider não é compatível com sessões em BD — o Auth.js
  // usa sempre JWT quando ele está presente, por isso não há tabela de
  // sessions no schema.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // client id/secret vêm de AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET no .env —
    // o Auth.js infere-os automaticamente pelo prefixo, não é preciso passá-los aqui.
    // Google verifica sempre o email antes de o devolver, por isso é seguro
    // ligar automaticamente a uma conta existente com o mesmo email (ex. a
    // que já tens por password) em vez de exigir um passo de ligação manual.
    Google({ allowDangerousEmailAccountLinking: true }),
    // AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET, mesma inferência automática.
    // O Facebook também obriga o utilizador a confirmar o email da conta,
    // por isso a mesma justificação do Google se aplica aqui.
    Facebook({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? session.user.id;
      session.user.role = token.role ?? "user";
      return session;
    },
  },
});
