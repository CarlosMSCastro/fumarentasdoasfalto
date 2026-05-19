"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart } from "lucide-react";

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/eventos", label: "Eventos" },
  { href: "/galeria", label: "Galeria" },
  { href: "/loja", label: "Loja" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const cartCount = 0;

  return (
    <nav className="w-full bg-[var(--surface)] border-b border-white/10 px-6 py-6 lg:py-7 overflow-visible">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 lg:pl-44">
        {/* Logo Desktop */}
        <Link href="/" className="hidden lg:block shrink-0 absolute left-1/6 top-1/10 -translate-y-1/2 z-10">
          <Image src="/logo.png" alt="Fumarentas do Asfalto" width={140} height={140} loading="eager"
            className="object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_0_12px_rgba(255,107,0,0.6)]" />
        </Link>

        {/* Logo Mobile */}
        <Link href="/" className="lg:hidden absolute left-1/6 top-1/12 -translate-y-1/2 z-10">
          <Image src="/logo.png" alt="Fumarentas do Asfalto" width={120} height={120} loading="eager"
            className="object-contain drop-shadow-[0_0_12px_rgba(255,107,0,0.6)]" />
        </Link>

        {/* Links Desktop */}
        <ul className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-[var(--foreground)] hover:text-[var(--primary)] drop-shadow-[0_0_4px_rgba(255,107,0,0.8)] hover:drop-shadow-[0_0_10px_rgba(255,107,0,5)] transition-all text-lg font-bold uppercase tracking-wide hover:tracking-widest">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Direita: Carrinho + Login */}
        <div className="flex items-center gap-4 shrink-0 ml-auto lg:ml-0">
          <Link href="/loja/carrinho" className="relative text-[var(--foreground)] hover:text-[var(--primary)] transition-all hover:drop-shadow-[0_0_8px_rgba(255,107,0,0.7)]">
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          </Link>

          <Link href="/login" className="hidden lg:block">
            <Button variant="outline" size="sm" className="border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-bold uppercase tracking-widest text-sm px-6 py-5 shadow-[0_0_6px_rgba(255,107,0,0.8)] hover:shadow-[0_0_16px_rgba(255,107,0,3.8)] transition-all">
              Login
            </Button>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden p-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
              <Menu size={32} />
            </SheetTrigger>
            <SheetContent side="right" className="bg-[var(--surface)] border-white/10">
              <ul className="flex flex-col gap-6 mt-12 items-center">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={() => setOpen(false)} className="text-[var(--foreground)] hover:text-[var(--primary)] drop-shadow-[0_0_4px_rgba(255,107,0,0.2)] hover:drop-shadow-[0_0_10px_rgba(255,107,0,0.8)] transition-all text-xl font-bold uppercase tracking-widest">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="w-full px-6 mt-4">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-transparent border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-bold uppercase tracking-widest text-sm py-6 shadow-[0_0_6px_rgba(255,107,0,0.2)] hover:shadow-[0_0_16px_rgba(255,107,0,0.8)] transition-all">
                      Login
                    </Button>
                  </Link>
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}