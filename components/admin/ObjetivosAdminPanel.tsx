"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImageUp } from "lucide-react";
import type { ObjetivoCardId } from "@/lib/objetivos";
import { trocarFotoObjetivoAdmin } from "@/app/actions/admin-objetivos";

// Mesmos 3 cards/ids que ObjetivosDesktop.tsx/ObjetivosMobile.tsx — sem
// add/remove, só a foto de cada um é editável.
const CARDS: { id: ObjetivoCardId; label: string }[] = [
  { id: "encontros", label: "Encontros e Passeios" },
  { id: "restauracao", label: "Restauração de Motorizadas" },
  { id: "workshops", label: "Workshops e Palestras" },
];

export default function ObjetivosAdminPanel({ fotos }: { fotos: Partial<Record<ObjetivoCardId, string>> }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const onTrocarFoto = (cardId: ObjetivoCardId, ficheiro: File) => {
    const fd = new FormData();
    fd.set("foto", ficheiro);
    setErro(null);
    startTransition(async () => {
      const resultado = await trocarFotoObjetivoAdmin(cardId, fd);
      if (resultado.error) setErro(resultado.error);
    });
  };

  return (
    <div>
      {erro && <p className="text-sm text-red-400 mb-4">{erro}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <div key={card.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-2">
            <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-white/5">
              {fotos[card.id] && <Image src={fotos[card.id]!} alt={card.label} fill sizes="300px" className="object-cover" />}
            </div>
            <p className="text-white/90 text-sm font-semibold text-center">{card.label}</p>
            <input
              ref={(el) => {
                fileInputRefs.current[card.id] = el;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const ficheiro = e.target.files?.[0];
                e.target.value = "";
                if (ficheiro) onTrocarFoto(card.id, ficheiro);
              }}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRefs.current[card.id]?.click()}
              className="flex items-center justify-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <ImageUp size={14} /> Trocar foto
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
