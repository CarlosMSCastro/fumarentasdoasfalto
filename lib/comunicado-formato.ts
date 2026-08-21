// Converte o texto simples com formatação básica que o admin escreve no
// compositor de /admin/comunicados (parágrafos separados por linha em
// branco, **negrito**) para HTML pronto a entrar no corpo de wrapEmail().
// Ao contrário de components/TextoComLinks.tsx (que produz nós React e por
// isso nunca precisou de escapar nada — o React já escapa texto sozinho),
// aqui construímos uma string HTML à mão, por isso o input do admin tem de
// ser neutralizado primeiro, antes de qualquer tag ser injetada.
function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Mesma regex do TextoComLinks.tsx, reaproveitada de propósito para o
// auto-linkify de URLs/emails se comportar de forma idêntica ao resto do
// site em vez de inventar outra heurística aqui.
const LINK_RE = /(https?:\/\/[^\s]+)|([^\s@]+@[^\s@]+\.[^\s@]+)/g;

function linkify(textoEscapado: string): string {
  return textoEscapado.replace(LINK_RE, (match, url) => {
    const ehUrl = Boolean(url);
    const href = ehUrl ? match : `mailto:${match}`;
    const alvo = ehUrl ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${alvo} style="color:#ff6b00;">${match}</a>`;
  });
}

// **texto** -> <strong>texto</strong>. Só esta marcação (sem itálico/
// listas/links manuais) — é a "formatação básica" pedida; mais do que isto
// fica para se algum dia for pedido.
function aplicarNegrito(textoEscapado: string): string {
  return textoEscapado.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function formatarComunicadoHtml(textoOriginal: string): string {
  const paragrafos = textoOriginal
    .trim()
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  return paragrafos
    .map((bloco) => {
      const escapado = escapeHtml(bloco);
      const comNegrito = aplicarNegrito(escapado);
      const comLinks = linkify(comNegrito);
      const comQuebras = comLinks.replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px;">${comQuebras}</p>`;
    })
    .join("");
}
