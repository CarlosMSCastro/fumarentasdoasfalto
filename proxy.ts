import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Rede de segurança central: cobre páginas protegidas mesmo que uma página
// nova se esqueça de repetir a verificação de sessão. Não substitui as
// verificações já existentes em app/perfil/page.tsx e nas Server Actions —
// ver nota em README.md sobre por que essas têm de continuar a existir.
export async function proxy(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/perfil"],
};
