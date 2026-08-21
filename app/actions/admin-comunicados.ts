"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { comunicados } from "@/lib/db/schema";
import { exigirAdmin } from "@/lib/admin-auth";
import { getTodosSocios, filtrarSociosComEmailValido } from "@/lib/quotagest";
import { sendComunicadoSocios } from "@/lib/email";
import { formatarComunicadoHtml } from "@/lib/comunicado-formato";

// Só os campos necessários para escolher destinatários — não leva dívida/
// NIF/etc. para o cliente sem necessidade.
export type SocioParaComunicado = { id: string; nome: string; email: string; quotaEmDia: boolean };

export async function obterSociosParaComunicado(): Promise<{
  socios: SocioParaComunicado[];
  invalidosCount: number;
  erro: boolean;
}> {
  await exigirAdmin();
  try {
    const todos = await getTodosSocios();
    const { validos, invalidos } = filtrarSociosComEmailValido(todos);
    return {
      socios: validos.map((s) => ({ id: s.id, nome: s.nome, email: s.email, quotaEmDia: s.quotaEmDia })),
      invalidosCount: invalidos.length,
      erro: false,
    };
  } catch {
    return { socios: [], invalidosCount: 0, erro: true };
  }
}

export type ComunicadoHistorico = typeof comunicados.$inferSelect;

export type EnviarComunicadoInput = {
  assunto: string;
  corpoTexto: string;
  // Emails já filtrados/selecionados no cliente (subconjunto de
  // obterSociosParaComunicado().socios, ou todos) — o servidor só valida
  // que a lista não está vazia, não decide quem entra.
  destinatarios: string[];
  // Contagem de sócios sem email válido no momento deste envio (já calculada
  // em obterSociosParaComunicado) — guardada no histórico para refletir com
  // precisão quantos ficaram de fora nesse envio específico.
  invalidosCount: number;
};

export async function enviarComunicadoAdmin(
  input: EnviarComunicadoInput
): Promise<{ error?: string; sucesso?: boolean; enviados?: number; falhados?: number; novoHistorico?: ComunicadoHistorico }> {
  await exigirAdmin();
  const session = await auth();

  const assunto = input.assunto.trim();
  const corpoTexto = input.corpoTexto.trim();
  // Dedupe defensivo — o mesmo sócio nunca deve receber o email duas vezes
  // por causa de uma seleção repetida no cliente.
  const destinatarios = [...new Set(input.destinatarios.map((e) => e.trim().toLowerCase()).filter(Boolean))];

  if (!assunto) return { error: "O assunto é obrigatório." };
  if (!corpoTexto) return { error: "A mensagem é obrigatória." };
  if (destinatarios.length === 0) return { error: "Seleciona pelo menos um destinatário." };

  const corpoHtml = formatarComunicadoHtml(corpoTexto);
  const { enviados, falhados } = await sendComunicadoSocios(destinatarios, assunto, corpoHtml);

  const status = falhados.length === 0 ? "sucesso" : enviados.length === 0 ? "falhou" : "parcial";

  const [novoHistorico] = await db
    .insert(comunicados)
    .values({
      assunto,
      corpoTexto,
      corpoHtml,
      destinatariosTotal: destinatarios.length,
      destinatariosEnviados: enviados.length,
      destinatariosFalhados: falhados.length,
      destinatariosInvalidos: input.invalidosCount,
      destinatariosEmails: enviados,
      status,
      enviadoPorId: session?.user?.id ?? null,
      enviadoPorNome: session?.user?.name || session?.user?.email || "Admin",
    })
    .returning();

  revalidatePath("/admin/comunicados");

  if (status === "falhou") return { error: "O envio falhou para todos os destinatários. Tenta novamente." };
  return { sucesso: true, enviados: enviados.length, falhados: falhados.length, novoHistorico };
}

export async function obterHistoricoComunicados(): Promise<ComunicadoHistorico[]> {
  await exigirAdmin();
  return db.select().from(comunicados).orderBy(desc(comunicados.createdAt)).limit(50);
}
