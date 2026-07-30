"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type PerfilFormState = { error?: string; success?: boolean } | undefined;

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
