"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { put } from "@vercel/blob";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users, emailChangeRequests, socioLinkRequests } from "@/lib/db/schema";
import { sendEmailChangeConfirmation, sendSocioLinkConfirmation } from "@/lib/email";
import { findSocioByCodigoOuNif } from "@/lib/quotagest";

export type PerfilFormState = { error?: string; success?: boolean } | undefined;

const EMAIL_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;
const SOCIO_LINK_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function atualizarPerfil(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  await db.update(users).set({ phone, addressLine, postalCode, city }).where(eq(users.id, session.user.id));
  revalidatePath("/perfil");

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

// Não associa de imediato — número de sócio e NIF não são segredo (dá para
// adivinhar/saber o de outra pessoa dentro da associação), por isso manda
// primeiro um email de confirmação para o endereço que o Quotagest tem
// registado para esse sócio (não para o email da conta que pediu isto).
// A associação só acontece em confirmarLigacaoSocio, quando o link for
// clicado.
export async function procurarSocio(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const query = String(formData.get("codigoOuNif") ?? "").trim();
  if (!query) return { error: "Introduz o número de sócio ou o NIF." };

  const socio = await findSocioByCodigoOuNif(query).catch(() => null);
  if (!socio) return { error: "Não encontrámos nenhum sócio com esse número ou NIF." };
  if (!socio.email) return { error: "Este registo de sócio não tem email associado — contacta a associação para ligar a conta manualmente." };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SOCIO_LINK_TOKEN_TTL_MS);
  await db.insert(socioLinkRequests).values({ userId: session.user.id, quotagestId: socio.id, token, expires });

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirmar-socio?token=${token}`;
  await sendSocioLinkConfirmation(socio.email, confirmUrl, socio.nome);

  return { success: true };
}

export async function confirmarLigacaoSocio(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Link inválido." };

  const [request] = await db.select().from(socioLinkRequests).where(eq(socioLinkRequests.token, token)).limit(1);
  if (!request || request.expires < new Date()) {
    return { error: "Link inválido ou expirado. Pede a associação novamente no teu perfil." };
  }

  await db.update(users).set({ quotagestId: request.quotagestId }).where(eq(users.id, request.userId));
  await db.delete(socioLinkRequests).where(eq(socioLinkRequests.token, token));

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
  if (!ALLOWED_FOTO_TYPES.includes(foto.type)) return { error: "Formato de imagem não suportado (usa JPEG, PNG, WEBP ou GIF)." };
  if (foto.size > MAX_FOTO_SIZE_BYTES) return { error: "A imagem não pode passar de 5MB." };

  const blob = await put(`avatares/${session.user.id}-${Date.now()}-${foto.name}`, foto, {
    access: "public",
  });

  await db.update(users).set({ image: blob.url }).where(eq(users.id, session.user.id));
  revalidatePath("/perfil");

  return { success: true };
}

// accounts/emailChangeRequests/socioLinkRequests têm onDelete: "cascade" no
// schema — apagar o user já limpa essas tabelas sozinho. orders.userId tem
// onDelete: "set null" de propósito: as encomendas ficam (histórico da
// associação), só deixam de estar ligadas a uma conta.
export async function apagarConta(_prevState: PerfilFormState, formData: FormData): Promise<PerfilFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Entra novamente." };

  const confirmacao = String(formData.get("confirmacao") ?? "");
  if (confirmacao !== "APAGAR") return { error: 'Escreve "APAGAR" para confirmares.' };

  await db.delete(users).where(eq(users.id, session.user.id));
  await signOut({ redirectTo: "/" });
}
