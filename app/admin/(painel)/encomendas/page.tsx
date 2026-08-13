import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { expirarMbwayPendentes } from "@/lib/expiracao";
import EncomendasAdminList, { type EncomendaAdmin } from "@/components/admin/EncomendasAdminList";

async function getTodasEncomendas(): Promise<EncomendaAdmin[]> {
  await expirarMbwayPendentes();

  const todas = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (todas.length === 0) return [];

  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, todas.map((e) => e.id)));

  return todas.map((encomenda) => ({
    ...encomenda,
    items: items.filter((item) => item.orderId === encomenda.id),
  }));
}

export default async function AdminEncomendasPage() {
  const encomendas = await getTodasEncomendas();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[#f8f0d9] mb-8">Encomendas</h1>
      <EncomendasAdminList encomendas={encomendas} />
    </div>
  );
}
