"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PenSquare } from "lucide-react";

const links = [
  { href: "/admin", label: "Início", icon: LayoutDashboard, disabled: false },
  { href: "/admin/encomendas", label: "Encomendas", icon: Package, disabled: false },
  { href: null, label: "Editar Conteúdo", icon: PenSquare, disabled: true },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 lg:w-56 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible border-b lg:border-b-0 lg:border-r border-white/10 pb-4 lg:pb-0 lg:pr-6 mb-2 lg:mb-0">
      {links.map((link) => {
        const Icon = link.icon;
        if (link.disabled || !link.href) {
          return (
            <span
              key={link.label}
              className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-white/25 text-sm font-semibold uppercase tracking-wide whitespace-nowrap cursor-not-allowed shrink-0"
            >
              <Icon size={18} /> {link.label}
            </span>
          );
        }
        const active = pathname === link.href;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all shrink-0 ${
              active ? "bg-primary/15 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} /> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
