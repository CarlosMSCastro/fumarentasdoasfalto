import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import AuthPageBackground from "@/components/AuthPageBackground";
import PerfilForm from "./PerfilForm";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect("/login");

  return (
    <AuthPageBackground>
      <PerfilForm user={user} />
    </AuthPageBackground>
  );
}
