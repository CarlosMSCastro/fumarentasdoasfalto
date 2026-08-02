// As fotos de perfil OAuth vêm por defeito numa resolução pequena. O Google
// anexa um sufixo tipo "=s96-c" à URL que pode ser pedido em qualquer
// tamanho à posteriori, sem restrições — não é um limite da API, é só o
// tamanho pedido por omissão. O Facebook não permite o mesmo truque: a URL
// (platform-lookaside.fbsbx.com) vem assinada, com o hash criptograficamente
// ligado ao width/height originais — mudar esses parâmetros à mão invalida a
// assinatura e o CDN responde 404. Para o Facebook, o tamanho só pode ser
// aumentado pedindo-o já na chamada à Graph API no momento do login (em
// auth.ts), não reescrevendo a URL aqui.
const GOOGLE_SIZE_RE = /=s\d+(-c)?$/;

export function getHighResAvatarUrl(url?: string | null, size = 400): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "lh3.googleusercontent.com") {
      return GOOGLE_SIZE_RE.test(url)
        ? url.replace(GOOGLE_SIZE_RE, `=s${size}-c`)
        : `${url}=s${size}-c`;
    }
    return url;
  } catch {
    return url;
  }
}
