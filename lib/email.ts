import { Resend } from "resend";

// TODO: rever templates — hoje são só HTML simples, sem marca visual
// nenhuma (sem logo, sem cores do site). Ver README.md > Backlog.
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

// Enviado para o email NOVO (não para o atual) — confirma que quem pediu a
// troca tem mesmo acesso à caixa de correio desse endereço.
export async function sendEmailChangeConfirmation(to: string, confirmUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirma o teu novo email — Fumarentas do Asfalto",
    html: `
      <p>Pediste para alterar o email da tua conta para este endereço.</p>
      <p><a href="${confirmUrl}">Clica aqui para confirmares a alteração</a></p>
      <p>Este link expira dentro de 1 hora. Se não pediste isto, ignora este email.</p>
    `,
  });
}

// Enviado para o email registado no Quotagest para esse sócio (não para o
// email da conta do site que pediu a associação) — só quem tem acesso a
// essa caixa de correio consegue confirmar, senão bastava saber/adivinhar o
// número de sócio ou NIF de outra pessoa para lhe ligar a conta.
// Disparado a partir do callback do Eupago quando uma encomenda passa a
// "pago" — não no momento da criação da encomenda, porque nessa altura
// ainda não sabemos se o pagamento vai mesmo acontecer.
export async function sendOrderConfirmation(
  to: string,
  encomenda: { id: string; itens: { nome: string; quantidade: number; precoCentimos: number }[]; totalCentimos: number }
) {
  const formatar = (centimos: number) => `${(centimos / 100).toFixed(2).replace(".", ",")} €`;
  const linhas = encomenda.itens
    .map((item) => `<li>${item.quantidade}× ${item.nome} — ${formatar(item.precoCentimos * item.quantidade)}</li>`)
    .join("");

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pagamento confirmado — Encomenda #${encomenda.id.slice(0, 8)}`,
    html: `
      <p>Recebemos o pagamento da tua encomenda #${encomenda.id.slice(0, 8)}. Obrigado!</p>
      <ul>${linhas}</ul>
      <p><strong>Total: ${formatar(encomenda.totalCentimos)}</strong></p>
      <p>Vamos entrar em contacto para combinar a entrega/envio.</p>
    `,
  });
}

// Enviado no momento em que a referência é gerada (não quando é paga) —
// é o único registo permanente que o cliente fica a ter da Entidade/
// Referência se fechar a janela do checkout antes de anotar/pagar. Também
// fica visível depois em /perfil (ver PerfilForm.tsx), mas só para quem
// tem conta — este email chega a todos, incluindo compras de convidado.
export async function sendReferenciaMultibanco(
  to: string,
  encomenda: { id: string; entidade: string; referencia: string; valor: number }
) {
  const valorFormatado = `${encomenda.valor.toFixed(2).replace(".", ",")} €`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Referência Multibanco — Encomenda #${encomenda.id.slice(0, 8)}`,
    html: `
      <p>A tua encomenda #${encomenda.id.slice(0, 8)} está registada. Usa os dados abaixo para pagar por Multibanco:</p>
      <p>
        <strong>Entidade: ${encomenda.entidade}</strong><br>
        <strong>Referência: ${encomenda.referencia}</strong><br>
        <strong>Valor: ${valorFormatado}</strong>
      </p>
      <p>Assim que o pagamento for confirmado, recebes outro email e a encomenda passa a "paga".</p>
    `,
  });
}

export async function sendSocioLinkConfirmation(to: string, confirmUrl: string, nomeSocio: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirma a associação da tua conta — Fumarentas do Asfalto",
    html: `
      <p>Alguém pediu para ligar uma conta no site ao registo de sócio de <strong>${nomeSocio}</strong>.</p>
      <p><a href="${confirmUrl}">Clica aqui para confirmares a associação</a></p>
      <p>Este link expira dentro de 1 hora. Se não foste tu, ignora este email.</p>
    `,
  });
}
