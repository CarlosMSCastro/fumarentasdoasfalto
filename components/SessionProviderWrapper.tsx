"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Sessões são JWT (ver auth.ts), por isso o token não reflete alterações à
// BD feitas depois do login (ex: nova foto de perfil). Este provider dá ao
// resto da app acesso a useSession(), cujo update() força o Auth.js a correr
// de novo o callback jwt (com trigger:"update") e a devolver o token
// atualizado — sem isto o Navbar ficava sempre preso aos dados do login.
export default function SessionProviderWrapper({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  // SessionProvider só usa a prop `session` para o estado inicial — nunca a
  // volta a ler depois do primeiro mount (confirmado no código-fonte do
  // next-auth). Isso significa que um login/logout (que faz o RootLayout
  // correr auth() de novo no servidor e mandar uma `session` fresca por
  // prop) não chegava a refletir-se no useSession() do Navbar sem F5. A key
  // força um remount sempre que a identidade da sessão muda, sem interferir
  // com o update() usado para refrescar a foto de perfil (que mantém o
  // mesmo id, logo não remonta).
  return (
    <SessionProvider key={session?.user?.id ?? "guest"} session={session}>
      {children}
    </SessionProvider>
  );
}
