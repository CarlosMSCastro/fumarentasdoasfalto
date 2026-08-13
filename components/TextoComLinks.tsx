// Sem "use client" — é um componente puro (sem hooks/estado), funciona tanto
// em Server como Client Components. Faz auto-linkify de emails/URLs em texto
// simples (ex: o "mailto:" da secção "Contacto" das páginas legais) sem
// aceitar HTML cru do campo de texto do admin — nada de
// dangerouslySetInnerHTML.
const LINK_RE = /(https?:\/\/[^\s]+)|([^\s@]+@[^\s@]+\.[^\s@]+)/g;

export default function TextoComLinks({ texto }: { texto: string }) {
  const partes: React.ReactNode[] = [];
  let ultimoIndex = 0;
  let chave = 0;

  // matchAll (em vez de exec + lastIndex manual) não muta o LINK_RE
  // partilhado a nível de módulo — mutar o lastIndex de um regex definido
  // fora do componente durante o render não é seguro.
  for (const match of texto.matchAll(LINK_RE)) {
    if (match.index > ultimoIndex) partes.push(texto.slice(ultimoIndex, match.index));
    const valor = match[0];
    const ehUrl = Boolean(match[1]);
    partes.push(
      <a
        key={chave++}
        href={ehUrl ? valor : `mailto:${valor}`}
        target={ehUrl ? "_blank" : undefined}
        rel={ehUrl ? "noopener noreferrer" : undefined}
        className="text-orange-500 hover:text-orange-400"
      >
        {valor}
      </a>
    );
    ultimoIndex = match.index + valor.length;
  }
  if (ultimoIndex < texto.length) partes.push(texto.slice(ultimoIndex));

  return <>{partes}</>;
}
