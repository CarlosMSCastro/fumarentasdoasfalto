import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Domínio temporário (quizdabola.fun) até à migração para o domínio
// definitivo da associação — ver CLAUDE.md / troca é só esta linha.
const FROM = "Fumarentas do Asfalto <naoresponder@quizdabola.fun>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Redefinir password — Fumarentas do Asfalto",
    html: `
      <p>Recebemos um pedido para redefinir a password da tua conta.</p>
      <p><a href="${resetUrl}">Clica aqui para definires uma nova password</a></p>
      <p>Este link expira dentro de 1 hora. Se não pediste isto, ignora este email.</p>
    `,
  });
}
