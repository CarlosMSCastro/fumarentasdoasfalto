"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, emailChangeRequests } from "@/lib/db/schema";
import { sendEmailChangeConfirmation } from "@/lib/email";

export type PerfilFormState = { error?: string; success?: boolean } | undefined;

const EMAIL_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024;

export async function atualizarPerfil(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  await db.update(users).set({ phone, addressLine, postalCode, city }).where(eq(users.id, session.user.id));

  return { success: true };
}

export async function alterarPassword(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const passwordAtual = String(formData.get("passwordAtual") ?? "");
  const novaPassword = String(formData.get("novaPassword") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");

  if (novaPassword.length < 8) return { error: "A nova password tem de ter pelo menos 8 caracteres." };
  if (novaPassword !== confirmarPassword) return { error: "As passwords não coincidem." };

  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user?.passwordHash) return { error: "Esta conta não tem password definida." };

  const valid = await compare(passwordAtual, user.passwordHash);
  if (!valid) return { error: "Password atual incorreta." };

  const passwordHash = await hash(novaPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, session.user.id));

  return { success: true };
}

export async function pedirAlteracaoEmail(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const novoEmail = String(formData.get("novoEmail") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) return { error: "Email inválido." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, novoEmail)).limit(1);
  if (existing) return { error: "Já existe uma conta com este email." };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);
  await db.insert(emailChangeRequests).values({ userId: session.user.id, newEmail: novoEmail, token, expires });

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirmar-email?token=${token}`;
  await sendEmailChangeConfirmation(novoEmail, confirmUrl);

  return { success: true };
}

// Só permite carregar foto se ainda não houver nenhuma configurada (do
// Google/Facebook ou de um upload anterior) — evita ter de guardar/repor a
// foto original do OAuth, porque nunca deixamos substituir uma já existente.
export async function atualizarFoto(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const [user] = await db.select({ image: users.image }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (user?.image) return { error: "Já tens uma foto configurada." };

  const foto = formData.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return { error: "Escolhe uma imagem." };
  if (!foto.type.startsWith("image/")) return { error: "O ficheiro tem de ser uma imagem." };
  if (foto.size > MAX_FOTO_SIZE_BYTES) return { error: "A imagem não pode passar de 5MB." };

  const blob = await put(`avatares/${session.user.id}-${Date.now()}-${foto.name}`, foto, {
    access: "public",
  });

  await db.update(users).set({ image: blob.url }).where(eq(users.id, session.user.id));

  return { success: true };
}
