import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./lib/db");
  const { orders } = await import("./lib/db/schema");
  const { desc } = await import("drizzle-orm");
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5);
  console.log(`--- ${rows.length} encomenda(s) mais recentes ---`);
  for (const r of rows) {
    console.log({
      id: r.id,
      status: r.status,
      metodoPagamento: r.metodoPagamento,
      totalCentimos: r.totalCentimos,
      eupagoIdentificador: r.eupagoIdentificador,
      referenciaMbEntidade: r.referenciaMbEntidade,
      referenciaMbNumero: r.referenciaMbNumero,
      createdAt: r.createdAt,
      paidAt: r.paidAt,
    });
  }
}

main().catch((e) => console.error("ERRO:", e.message));
