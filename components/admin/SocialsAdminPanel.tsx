"use client";

import { useTransition } from "react";
import type { TextoChave } from "@/lib/textos";
import { BlocoTextoEditavel } from "@/components/admin/TextosAdminList";

export default function SocialsAdminPanel({ textos }: { textos: Record<TextoChave, string> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <BlocoTextoEditavel
        titulo="Redes sociais"
        textos={textos}
        isPending={isPending}
        startTransition={startTransition}
        campos={[
          { chave: "social.facebook.url", legenda: "Facebook" },
          { chave: "social.instagram.url", legenda: "Instagram" },
        ]}
      />
    </div>
  );
}
