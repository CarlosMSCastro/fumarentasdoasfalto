"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AREAS = [
  { href: "/admin/conteudo/fundadores", label: "Fundadores" },
  { href: "/admin/conteudo/objetivos", label: "Objetivos" },
  { href: "/admin/conteudo/textos", label: "Textos" },
  { href: "/admin/conteudo/socials", label: "Socials" },
  { href: "/admin/conteudo/eventos", label: "Eventos" },
  { href: "/admin/conteudo/produtos", label: "Produtos" },
] as const;

export default function ConteudoSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-8">
      {AREAS.map((area) => {
        const ativo = pathname.startsWith(area.href);
        return (
          <Link
            key={area.href}
            href={area.href}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all whitespace-nowrap border ${
              ativo
                ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]"
                : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
            }`}
          >
            {area.label}
          </Link>
        );
      })}
    </div>
  );
}
