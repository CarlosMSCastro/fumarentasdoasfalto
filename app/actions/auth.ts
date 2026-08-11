"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, verificationTokens, emailChangeRequests } from "@/lib/db/schema";
import { signIn, signOut } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export type AuthFormState = { error?: string } | undefined;
export type ResetRequestState = { error?: string; success?: boolean } | undefined;
export type RegistarFormState = { error?: string; success?: boolean } | undefined;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Resposta igual quer o email já tenha conta ou não, e sem login automático
// — evita que este formulário sirva para descobrir quais emails são sócios
// (enumeração de utilizadores). O hash da password corre sempre, mesmo no
// caso de email duplicado, para o tempo de resposta não denunciar qual dos
// dois casos aconteceu.
export async function registar(_prevState: RegistarFormState, formData: FormData): Promise<RegistarFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) return { error: "Indica o teu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido." };
  if (password.length < 8) return { error: "A password tem de ter pelo menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "As passwords não coincidem." };

  const passwordHash = await hash(password, 10);

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!existing) {
    await db.insert(users).values({ name, email, passwordHash });
  }

  return { success: true };
}

export async function entrar(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email ou password incorretos." };
    throw error;
  }
}

export async function terminarSessao() {
  await signOut({ redirectTo: "/" });
}

export async function entrarComGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function entrarComFacebook() {
  await signIn("facebook", { redirectTo: "/" });
}

// Resposta igual quer o email exista ou não na BD — evita que este formulário
// sirva para descobrir quais emails têm conta (enumeração de utilizadores).
export async function pedirResetPassword(_prevState: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido." };

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await db.insert(verificationTokens).values({ identifier: email, token, expires });
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { success: true };
}

export async function redefinirPassword(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Link inválido." };
  if (password.length < 8) return { error: "A password tem de ter pelo menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "As passwords não coincidem." };

  const [record] = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token)).limit(1);
  if (!record || record.expires < new Date()) return { error: "Link inválido ou expirado. Pede um novo." };

  const passwordHash = await hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.email, record.identifier));
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  redirect("/login");
}

export async function confirmarAlteracaoEmail(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Link inválido." };

  const [request] = await db.select().from(emailChangeRequests).where(eq(emailChangeRequests.token, token)).limit(1);
  if (!request || request.expires < new Date()) return { error: "Link inválido ou expirado. Pede a alteração novamente no teu perfil." };

  await db.update(users).set({ email: request.newEmail }).where(eq(users.id, request.userId));
  await db.delete(emailChangeRequests).where(eq(emailChangeRequests.token, token));

  redirect("/login");
}
