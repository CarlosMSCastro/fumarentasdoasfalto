import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, verificationTokens } from "@/lib/db/schema";

// O objeto profile que chega ao callback jwt é o formato em bruto de cada
// provider, não o já mapeado para {id,name,email,image} que o Auth.js usa
// internamente para criar utilizadores — por isso tem de se ler o campo
// certo consoante o provider: OIDC (Google) usa "picture" direto, o Facebook
// devolve-o aninhado em picture.data.url.
function extractProviderImage(profile: unknown): string | undefined {
  if (!profile || typeof profile !== "object") return undefined;
  const p = profile as Record<string, unknown>;
  if (typeof p.picture === "string") return p.picture;
  const nested = p.picture as { data?: { url?: string } } | undefined;
  if (nested?.data?.url) return nested.data.url;
  if (typeof p.image === "string") return p.image;
  return undefined;
}

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

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, profile, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // trigger:"update" é despoletado pelo useSession().update() no
      // cliente (ver atualizarFoto em app/actions/perfil.ts + PerfilForm) —
      // o JWT é estático entre logins, por isso é a única forma de refletir
      // no Navbar uma foto trocada a meio da sessão sem obrigar a re-login.
      if (trigger === "update" && token.id) {
        const [dbUser] = await db.select({ image: users.image }).from(users).where(eq(users.id, token.id as string)).limit(1);
        if (dbUser) token.picture = dbUser.image;
      }
      // token.picture já vem pré-preenchido pelo Auth.js a partir de
      // user.image (a foto guardada na BD). Para contas que ligaram
      // Google/Facebook a uma conta já existente por password — nesses
      // casos o Auth.js reaproveita a conta tal como está, sem copiar a
      // foto do perfil OAuth — usamos aqui a foto que o provider trouxe
      // agora para preencher o que falta. Corre em todo login OAuth (não só
      // no momento da primeira ligação), por isso resolve-se sozinho no
      // login seguinte, mesmo para contas já ligadas antes deste código existir.
      const providerImage = extractProviderImage(profile);
      if (token.id && !token.picture && providerImage) {
        await db.update(users).set({ image: providerImage }).where(eq(users.id, token.id as string));
        token.picture = providerImage;
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
