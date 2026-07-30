import type { DefaultSession } from "next-auth";

// A augmentação tem de apontar para @auth/core/types e @auth/core/jwt, não
// para "next-auth"/"next-auth/jwt" — esses ficheiros só fazem
// `export type { Session } from "@auth/core/types"`, e um re-export não é o
// mesmo módulo para efeitos de declaration merging do TypeScript.
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
  }
}
