import "server-only";
import { auth } from "@/auth";

// Partilhado por todos os ficheiros app/actions/admin*.ts — extraído em vez
// de duplicado, porque exportar isto diretamente de um ficheiro "use server"
// tornava-o (em teoria) invocável como Server Action a partir do cliente.
export async function exigirAdmin(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Não autorizado");
}
