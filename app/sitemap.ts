import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getEventos } from "@/lib/eventos";

// Só rotas públicas e indexáveis — /checkout, /perfil, /login, etc. são
// funcionais/privadas, não conteúdo a aparecer numa pesquisa. /admin fica
// de fora aqui e é bloqueado explicitamente em app/robots.ts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const eventos = await getEventos();

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/sobre`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/eventos`, changeFrequency: "weekly", priority: 0.8 },
    ...eventos.map((evento) => ({
      url: `${SITE_URL}/eventos/${evento.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    { url: `${SITE_URL}/loja`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
