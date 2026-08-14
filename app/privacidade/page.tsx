import type { Metadata } from "next";
import PaginaLegal from "@/components/PaginaLegal";
import TextoComLinks from "@/components/TextoComLinks";
import { getTextos, getSeccoesLegais } from "@/lib/textos";

export async function generateMetadata(): Promise<Metadata> {
  const textos = await getTextos();
  return { title: textos["legal.privacidade.titulo"] };
}

export default async function PrivacidadePage() {
  const [textos, seccoes] = await Promise.all([getTextos(), getSeccoesLegais("privacidade")]);

  return (
    <PaginaLegal titulo={textos["legal.privacidade.titulo"]}>
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
