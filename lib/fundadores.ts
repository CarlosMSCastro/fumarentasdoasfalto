import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { fundadores } from "@/lib/db/schema";

export type Fundador = typeof fundadores.$inferSelect;

export async function getFundadores(): Promise<Fundador[]> {
  return db.select().from(fundadores).orderBy(asc(fundadores.ordem));
}
