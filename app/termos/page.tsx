import type { Metadata } from "next";
import PaginaLegal from "@/components/PaginaLegal";
import TextoComLinks from "@/components/TextoComLinks";
import { getTextos, getSeccoesLegais } from "@/lib/textos";

// Título vem do mesmo lugar (textos CMS) que a própria página usa — nunca
// desalinha do que é mostrado, mesmo que o Sr. Joaquim o edite em /admin.
export async function generateMetadata(): Promise<Metadata> {
  const textos = await getTextos();
  return { title: textos["legal.termos.titulo"] };
}

export default async function TermosPage() {
  const [textos, seccoes] = await Promise.all([getTextos(), getSeccoesLegais("termos")]);

  return (
    <PaginaLegal titulo={textos["legal.termos.titulo"]}>
      {seccoes.map((seccao) => (
        <div key={seccao.id}>
          {seccao.subtitulo && <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">{seccao.subtitulo}</h2>}
          <p>
            <TextoComLinks texto={seccao.corpo} />
          </p>
        </div>
      ))}
    </PaginaLegal>
  );
}
