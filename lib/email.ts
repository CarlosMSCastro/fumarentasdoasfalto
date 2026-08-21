import "server-only";
import { Resend } from "resend";
import { gerarReciboPdf } from "@/lib/recibo-pdf";
import { formatarPreco } from "@/lib/preco";

const resend = new Resend(process.env.RESEND_API_KEY);

// fumarentasdoasfalto.pt (não .com) porque o DNS deste domínio está na
// Amen, que suporta o registo MX exigido pela verificação de "Enable
// Sending" do Resend — a Wix (onde o .com está) não suporta MX em
// subdomínios, por isso o .com nunca passou de "Pending" (ver histórico
// desta migração). Confirmado com um envio de teste real 2026-08-21.
const FROM = "Fumarentas do Asfalto <naoresponder@fumarentasdoasfalto.pt>";

// Caixa de correio da própria associação, para onde vão as notificações
// internas (novo registo, nova encomenda) — não é segredo, não precisa de
// ser env var.
const ASSOCIACAO_EMAIL = "fumarentasdoasfalto@gmail.com";

const PRIMARY = "#ff6b00";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL;

// Cartão claro (não o fundo escuro do site) de propósito — clientes de
// email (Gmail/Outlook) lidam mal com CSS mais complexo, e um fundo escuro
// arrisca-se a ficar ilegível ou partido nalguns deles. O laranja da marca
// fica para o cabeçalho, títulos e botões; o corpo do texto é sempre texto
// escuro sobre branco, para garantir legibilidade em qualquer cliente.
function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td align="center" style="background:#050505;padding:24px;">
                <img src="${SITE_URL}/logo.png" alt="Fumarentas do Asfalto" width="56" height="56" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;color:#1a1a1a;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f4f4f4;padding:16px 28px;text-align:center;color:#888888;font-size:12px;">
                Fumarentas do Asfalto<br />Este é um email automático — não respondas a esta mensagem.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function emailButton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${PRIMARY};border-radius:999px;">
    <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;">${texto}</a>
  </td></tr></table>`;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Redefinir password — Fumarentas do Asfalto",
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Redefinir password</h2>
      <p>Recebemos um pedido para redefinir a password da tua conta.</p>
      ${emailButton("Definir nova password", resetUrl)}
      <p style="color:#666666;font-size:13px;">Este link expira dentro de 1 hora. Se não pediste isto, ignora este email.</p>
    `),
  });
}

// Enviado para o email NOVO (não para o atual) — confirma que quem pediu a
// troca tem mesmo acesso à caixa de correio desse endereço.
export async function sendEmailChangeConfirmation(to: string, confirmUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirma o teu novo email — Fumarentas do Asfalto",
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Confirmar novo email</h2>
      <p>Pediste para alterar o email da tua conta para este endereço.</p>
      ${emailButton("Confirmar alteração", confirmUrl)}
      <p style="color:#666666;font-size:13px;">Este link expira dentro de 1 hora. Se não pediste isto, ignora este email.</p>
    `),
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
  encomenda: {
    id: string;
    nome: string;
    itens: { nome: string; quantidade: number; precoCentimos: number }[];
    totalCentimos: number;
  }
) {
  const formatar = (centimos: number) => formatarPreco(centimos / 100);
  const linhas = encomenda.itens
    .map((item) => `<li>${item.quantidade}× ${item.nome} — ${formatar(item.precoCentimos * item.quantidade)}</li>`)
    .join("");

  // Falha suave: se o PDF rebentar por algum motivo, o email de confirmação
  // ainda deve sair — só sem o anexo. Ver lib/recibo-pdf.tsx.
  const reciboPdf = await gerarReciboPdf({
    id: encomenda.id,
    nome: encomenda.nome,
    data: new Date(),
    itens: encomenda.itens,
    totalCentimos: encomenda.totalCentimos,
  }).catch(() => null);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pagamento confirmado — Encomenda #${encomenda.id.slice(0, 8)}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Pagamento confirmado</h2>
      <p>Recebemos o pagamento da tua encomenda <strong>#${encomenda.id.slice(0, 8)}</strong>. Obrigado!</p>
      <ul style="padding-left:20px;">${linhas}</ul>
      <p style="font-size:17px;"><strong>Total: ${formatar(encomenda.totalCentimos)}</strong></p>
      <p style="color:#666666;font-size:13px;">O recibo (sem valor fiscal) vai em anexo, em PDF.</p>
    `),
    attachments: reciboPdf ? [{ filename: `recibo-${encomenda.id.slice(0, 8)}.pdf`, content: reciboPdf }] : undefined,
  });
}

// Enviado no momento em que a referência é gerada (não quando é paga) —
// é o único registo permanente que o cliente fica a ter da Entidade/
// Referência se fechar a janela do checkout antes de anotar/pagar. Também
// fica visível depois em /perfil (ver PerfilForm.tsx), mas só para quem
// tem conta — este email chega a todos, incluindo compras de convidado.
export async function sendReferenciaMultibanco(
  to: string,
  encomenda: { id: string; entidade: string; referencia: string; valor: number; dataFim: string }
) {
  const valorFormatado = formatarPreco(encomenda.valor);
  const dataFimFormatada = new Date(`${encomenda.dataFim}T00:00:00`).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
  });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Referência Multibanco — Encomenda #${encomenda.id.slice(0, 8)}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Referência Multibanco</h2>
      <p>A tua encomenda <strong>#${encomenda.id.slice(0, 8)}</strong> está registada. Usa os dados abaixo para pagar por Multibanco:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f4f4f4;border-radius:6px;width:100%;">
        <tr><td style="padding:16px 20px;font-size:16px;">
          <strong>Entidade:</strong> ${encomenda.entidade}<br />
          <strong>Referência:</strong> ${encomenda.referencia}<br />
          <strong>Valor:</strong> ${valorFormatado}
        </td></tr>
      </table>
      <p>Válida até <strong>${dataFimFormatada}</strong> — depois disso a referência deixa de aceitar pagamento.</p>
    `),
  });
}

export async function sendSocioLinkConfirmation(to: string, confirmUrl: string, nomeSocio: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirma a associação da tua conta — Fumarentas do Asfalto",
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Confirmar associação de sócio</h2>
      <p>Alguém pediu para ligar uma conta no site ao registo de sócio de <strong>${nomeSocio}</strong>.</p>
      ${emailButton("Confirmar associação", confirmUrl)}
      <p style="color:#666666;font-size:13px;">Este link expira dentro de 1 hora. Se não foste tu, ignora este email.</p>
    `),
  });
}

// Informativo, não bloqueia login/acesso — disparado só no ramo de conta
// nova de registar() (app/actions/auth.ts), nunca no ramo de email já
// existente. Importante: não awaited aí, para não reintroduzir a fuga por
// tempo de resposta entre os dois ramos que foi corrigida propositadamente
// nessa função (ver README.md > Autenticação > Proteções de segurança).
export async function sendWelcomeEmail(to: string, nome: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Bem-vindo à Fumarentas do Asfalto!",
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Bem-vindo, ${nome}!</h2>
      <p>A tua conta no site da Fumarentas do Asfalto foi criada com sucesso.</p>
      <p>No teu perfil consegues gerir os teus dados, ver o histórico de encomendas da loja, e ligar a tua conta ao teu registo de sócio para veres o estado da tua quota.</p>
      ${emailButton("Ir para o meu perfil", `${SITE_URL}/perfil`)}
    `),
  });
}

// Notificações internas para a associação — não interessam ao utilizador
// que despoletou a ação, por isso nunca devem bloquear/atrasar a resposta
// a essa pessoa. Chamar sem `await` nos sítios de origem (ou com
// .catch(() => null) se awaited), nunca deixar uma falha aqui rebentar o
// fluxo principal.
export async function sendNotificacaoNovoRegisto(nome: string, email: string) {
  await resend.emails.send({
    from: FROM,
    to: ASSOCIACAO_EMAIL,
    subject: `Novo registo no site — ${nome}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Novo registo no site</h2>
      <p><strong>${nome}</strong> criou uma conta no site.</p>
      <p style="color:#666666;font-size:13px;">Email: ${email}</p>
    `),
  });
}

// Disparado quando a encomenda passa a "pago" (não na criação) — a
// associação só quer processar/enviar encomendas já pagas, e só nesse ponto
// faz sentido mostrar a morada de entrega. Ver app/api/pagamentos/
// eupago-callback/route.ts, ao lado de sendOrderConfirmation.
export async function sendNotificacaoEncomendaPaga(encomenda: {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  totalCentimos: number;
  metodoPagamento: string;
  metodoEntrega: "envio" | "levantamento";
  moradaLinha: string | null;
  codigoPostal: string | null;
  cidade: string | null;
  itens: { nome: string; quantidade: number }[];
}) {
  const total = formatarPreco(encomenda.totalCentimos / 100);
  const entrega = encomenda.metodoEntrega === "levantamento" ? "levantamento em mão" : "envio";
  const linhas = encomenda.itens.map((item) => `<li>${item.quantidade}× ${item.nome}</li>`).join("");

  const detalheEntrega =
    encomenda.metodoEntrega === "envio"
      ? encomenda.moradaLinha
        ? `<p><strong>Morada de entrega:</strong><br />${encomenda.moradaLinha}<br />${encomenda.codigoPostal ?? ""} ${encomenda.cidade ?? ""}</p>`
        : ""
      : `<p>O cliente escolheu levantamento em mão — combinar por telefone <strong>${encomenda.telefone}</strong> ou email <strong>${encomenda.email}</strong>.</p>`;

  await resend.emails.send({
    from: FROM,
    to: ASSOCIACAO_EMAIL,
    subject: `Encomenda paga — #${encomenda.id.slice(0, 8)}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Encomenda paga</h2>
      <p><strong>${encomenda.nome}</strong> (${encomenda.email}, ${encomenda.telefone}) pagou <strong>${total}</strong>, por ${encomenda.metodoPagamento} — <strong>${entrega}</strong>.</p>
      <ul style="padding-left:20px;">${linhas}</ul>
      ${detalheEntrega}
      <p style="color:#666666;font-size:13px;">Encomenda #${encomenda.id.slice(0, 8)}</p>
    `),
  });
}

// Espelha sendReferenciaMultibanco, mas para MB WAY — o Multibanco já
// mandava uma confirmação inicial ao criar a encomenda, o MB WAY não
// mandava nada até ao pagamento ser confirmado. Corrigido a pedido do
// utilizador, 2026-08-11.
export async function sendConfirmacaoMbway(to: string, encomenda: { id: string; valor: number; telemovel: string }) {
  const valorFormatado = formatarPreco(encomenda.valor);
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pedido de pagamento MB WAY — Encomenda #${encomenda.id.slice(0, 8)}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Confirma o pagamento na app MB WAY</h2>
      <p>A tua encomenda <strong>#${encomenda.id.slice(0, 8)}</strong> está registada. Enviámos um pedido de pagamento de <strong>${valorFormatado}</strong> para o número <strong>${encomenda.telemovel}</strong>.</p>
      <p>Abre a app MB WAY no teu telemóvel e confirma o pagamento — <strong>tens 5 minutos</strong> a partir de agora, depois disso o pedido expira.</p>
    `),
  });
}

// Disparado quando o admin marca a encomenda como "enviado" no painel (ver
// marcarEnviadoAdmin em app/actions/admin.ts) — mensagem diferente consoante
// o método de entrega, à semelhança de sendNotificacaoEncomendaPaga.
// codigoRastreio é opcional (nem todos os envios têm um — ver comentário no
// schema) e só aparece no email quando o admin o preencheu.
export async function sendEncomendaEnviada(
  to: string,
  encomenda: { id: string; metodoEntrega: "envio" | "levantamento"; codigoRastreio?: string | null }
) {
  const paraEnvio = encomenda.metodoEntrega === "envio";
  const rastreio =
    paraEnvio && encomenda.codigoRastreio
      ? `<p><strong>Código de rastreio:</strong> ${encomenda.codigoRastreio}</p>`
      : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${paraEnvio ? "Encomenda enviada" : "Encomenda pronta para levantamento"} — #${encomenda.id.slice(0, 8)}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">${paraEnvio ? "Encomenda enviada" : "Pronta para levantamento"}</h2>
      <p>${
        paraEnvio
          ? `A tua encomenda <strong>#${encomenda.id.slice(0, 8)}</strong> foi enviada e está a caminho.`
          : `A tua encomenda <strong>#${encomenda.id.slice(0, 8)}</strong> já está pronta — podes vir levantá-la quando quiseres.`
      }</p>
      ${rastreio}
    `),
  });
}

// Disparado pelo webhook do Eupago (app/api/pagamentos/eupago-callback/
// route.ts) quando um pagamento de quota (não uma encomenda — ver
// pedirPagamentoQuota em app/actions/quota.ts) é confirmado. Nunca promete
// atualização instantânea do registo de sócio: o Quotagest não é tocado
// automaticamente, o Sr. Joaquim atualiza à mão (mesma janela de até 48h já
// avisada em /perfil).
export async function sendConfirmacaoQuotaPaga(to: string, dados: { nome: string; valor: number; dataPagamento: Date }) {
  const valorFormatado = formatarPreco(dados.valor);
  const dataFormatada = dados.dataPagamento.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Pagamento da quota confirmado — Fumarentas do Asfalto",
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Pagamento confirmado</h2>
      <p>Olá ${dados.nome}, recebemos o pagamento da tua quota de <strong>${valorFormatado}</strong>, em ${dataFormatada}. Obrigado!</p>
      <p style="color:#666666;font-size:13px;">O teu registo de sócio pode demorar até 48 horas a refletir isto — a associação atualiza-o manualmente.</p>
    `),
  });
}

// Interna, para a associação — separada de sendNotificacaoEncomendaPaga de
// propósito, para nunca ser confundida com uma venda da loja: ao contrário
// de uma encomenda normal, isto exige uma ação manual do Sr. Joaquim
// (marcar a quota como paga no Quotagest).
export async function sendNotificacaoQuotaPaga(dados: { nome: string; email: string; valor: number; metodoPagamento: string }) {
  const valorFormatado = formatarPreco(dados.valor);

  await resend.emails.send({
    from: FROM,
    to: ASSOCIACAO_EMAIL,
    subject: `QUOTA PAGA — ${dados.nome}`,
    html: wrapEmail(`
      <h2 style="color:${PRIMARY};margin:0 0 12px;">Quota paga</h2>
      <p><strong>${dados.nome}</strong> (${dados.email}) pagou a quota — <strong>${valorFormatado}</strong>, por ${dados.metodoPagamento}.</p>
      <p style="color:#666666;font-size:13px;">Não esquecer de marcar como paga no Quotagest.</p>
    `),
  });
}

export type ResultadoEnvioComunicado = { enviados: string[]; falhados: string[] };

// resend.batch.send não documenta um máximo oficial no pacote instalado
// (^6.18.1) — historicamente a Resend limitou lotes a 100, por isso
// fragmentamos de forma defensiva em lotes de 50 em vez de confiar nesse
// número exato.
const TAMANHO_LOTE_COMUNICADO = 50;

function dividirEmLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

// Envio em massa a sócios (/admin/comunicados). bodyHtml já vem transformado
// por formatarComunicadoHtml (lib/comunicado-formato.ts) — esta função só
// embrulha em wrapEmail e envia, tal como todas as outras send* deste
// ficheiro; não sabe nada de Quotagest nem da BD (isso fica no server
// action que a chama).
//
// Lotes em paralelo via Promise.all, não sequencial — mesmo padrão já usado
// no projeto para "muitas chamadas a uma API externa numa só ação" (ver
// apagarEventoAdmin em app/actions/admin-eventos.ts).
//
// Em modo "strict" (o default do SDK), resend.batch.send não dá granularidade
// por destinatário: ou o lote inteiro passa, ou a chamada falha por inteiro.
// Passamos "permissive" e usamos data.errors (índices relativos ao lote)
// para saber exatamente que endereços falharam dentro de um lote que teve
// sucesso parcial — nunca assumir que um item de data.data pode ser "falsy"
// para marcar falha, o tipo garante que é sempre { id: string }.
export async function sendComunicadoSocios(
  destinatarios: string[],
  assunto: string,
  bodyHtml: string
): Promise<ResultadoEnvioComunicado> {
  const html = wrapEmail(bodyHtml);
  const lotes = dividirEmLotes(destinatarios, TAMANHO_LOTE_COMUNICADO);

  const resultadosPorLote = await Promise.all(
    lotes.map(async (lote) => {
      const { data, error } = await resend.batch.send(
        lote.map((to) => ({ from: FROM, to, subject: assunto, html })),
        { batchValidation: "permissive" }
      );
      if (error || !data) return { enviados: [], falhados: lote };
      const indicesFalhados = new Set((data.errors ?? []).map((e) => e.index));
      const enviados = lote.filter((_, i) => !indicesFalhados.has(i));
      const falhados = lote.filter((_, i) => indicesFalhados.has(i));
      return { enviados, falhados };
    })
  );

  return resultadosPorLote.reduce(
    (acc, r) => ({ enviados: [...acc.enviados, ...r.enviados], falhados: [...acc.falhados, ...r.falhados] }),
    { enviados: [], falhados: [] } as ResultadoEnvioComunicado
  );
}
