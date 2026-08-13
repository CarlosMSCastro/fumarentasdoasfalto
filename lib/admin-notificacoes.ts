import "server-only";
import { db } from "@/lib/db";
import { adminSecoesVistas, type adminSecaoEnum } from "@/lib/db/schema";

export type AdminSecao = (typeof adminSecaoEnum.enumValues)[number];

// Chamado no topo de cada página de secção (/admin/encomendas, /admin/socios,
// /admin/utilizadores) — marca "vista agora", o que zera o badge de "N
// novos" dessa secção no ecrã inicial na próxima vez que for carregado.
export async function marcarSecaoVista(secao: AdminSecao): Promise<void> {
  await db
    .insert(adminSecoesVistas)
    .values({ secao, vistaEm: new Date() })
    .onConflictDoUpdate({ target: adminSecoesVistas.secao, set: { vistaEm: new Date() } });
}

// null quando a secção nunca foi visitada — usado pelo /admin para decidir a
// baseline de "N novos" (ver getResumoAdmin em app/admin/page.tsx): sem
// visita registada, tudo o que existe conta como "ainda não visto".
export async function obterUltimasVisitas(): Promise<Record<AdminSecao, Date | null>> {
  const rows = await db.select().from(adminSecoesVistas);
  const mapa = new Map(rows.map((r) => [r.secao, r.vistaEm]));
  return {
    encomendas: mapa.get("encomendas") ?? null,
    socios: mapa.get("socios") ?? null,
    utilizadores: mapa.get("utilizadores") ?? null,
  };
}
