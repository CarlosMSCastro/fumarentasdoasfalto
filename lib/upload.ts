import "server-only";
import sharp from "sharp";
import { put, del } from "@vercel/blob";

export const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_FOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Fotos vindas de telemóvel (ex: 4000x3000) chegam muito acima de qualquer
// tamanho de exibição real no site — sem isto, o Next teria de decodificar
// o original gigante a cada transformação de imagem pedida. GIF fica de
// fora (sharp não anima), fica como veio.
const LADO_MAXIMO = 1600;

// GIF não passa pelo sharp (não anima), por isso é o único formato que
// nunca tem o conteúdo verificado a sério — um Content-Type "image/gif"
// declarado pelo cliente não garante nada sobre o ficheiro em si. Confirma
// aqui a assinatura real (magic bytes) em vez de confiar cegamente nisso.
const GIF_HEADER = new TextEncoder().encode("GIF8");

async function ficheiroEhGifValido(ficheiro: File): Promise<boolean> {
  const cabecalho = new Uint8Array(await ficheiro.slice(0, 4).arrayBuffer());
  return GIF_HEADER.every((byte, i) => cabecalho[i] === byte);
}

async function redimensionarSeNecessario(ficheiro: File): Promise<File> {
  if (ficheiro.type === "image/gif") {
    if (!(await ficheiroEhGifValido(ficheiro))) throw new Error("Ficheiro não é um GIF válido.");
    return ficheiro;
  }
  const buffer = Buffer.from(await ficheiro.arrayBuffer());
  const redimensionado = await sharp(buffer)
    .resize(LADO_MAXIMO, LADO_MAXIMO, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  return new File([new Uint8Array(redimensionado)], ficheiro.name, { type: ficheiro.type });
}

type ResultadoValidacaoFoto = { erro: string; ficheiro: null } | { erro: null; ficheiro: File };

// Partilhado entre todos os pontos de upload de imagem do site (foto de
// perfil em app/actions/perfil.ts, e os novos formulários do CMS de
// conteúdo — fundadores/eventos/objetivos/produtos) — mesma validação em
// todo o lado, uma única mensagem de erro por caso. erro/ficheiro ambos
// sempre presentes (em vez de opcionais) para o TypeScript conseguir
// estreitar o tipo corretamente a partir de `if (validacao.erro)`.
export function validarFoto(foto: FormDataEntryValue | null): ResultadoValidacaoFoto {
  if (!(foto instanceof File) || foto.size === 0) return { erro: "Escolhe uma imagem.", ficheiro: null };
  if (!ALLOWED_FOTO_TYPES.includes(foto.type)) {
    return { erro: "Formato de imagem não suportado (usa JPEG, PNG, WEBP ou GIF).", ficheiro: null };
  }
  if (foto.size > MAX_FOTO_SIZE_BYTES) return { erro: "A imagem não pode passar de 5MB.", ficheiro: null };
  return { erro: null, ficheiro: foto };
}

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// prefixo nunca deve incluir o nome do ficheiro original do cliente
// (File.name é controlado por quem faz o pedido, trivial de forjar) — a
// extensão vem sempre do foto.type já validado em validarFoto, nunca do
// nome que o browser reportou.
export async function carregarFoto(prefixo: string, ficheiro: File): Promise<string> {
  const foto = await redimensionarSeNecessario(ficheiro);
  const extensao = EXTENSAO_POR_TIPO[ficheiro.type] ?? "jpg";
  const blob = await put(`${prefixo}.${extensao}`, foto, { access: "public" });
  return blob.url;
}

// Falha suave sempre — um ficheiro órfão no Blob é um problema barato, um
// apagar que falha por causa de um soluço do Blob não é. Nunca lançar,
// nunca bloquear o apagar da linha correspondente na BD.
export async function apagarFoto(url: string): Promise<void> {
  await del(url).catch(() => null);
}
