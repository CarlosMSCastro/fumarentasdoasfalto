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

async function redimensionarSeNecessario(ficheiro: File): Promise<File> {
  if (ficheiro.type === "image/gif") return ficheiro;
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

export async function carregarFoto(caminho: string, ficheiro: File): Promise<string> {
  const foto = await redimensionarSeNecessario(ficheiro);
  const blob = await put(caminho, foto, { access: "public" });
  return blob.url;
}

// Falha suave sempre — um ficheiro órfão no Blob é um problema barato, um
// apagar que falha por causa de um soluço do Blob não é. Nunca lançar,
// nunca bloquear o apagar da linha correspondente na BD.
export async function apagarFoto(url: string): Promise<void> {
  await del(url).catch(() => null);
}
