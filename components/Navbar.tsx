"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart } from "lucide-react";
import { scrollToContactosBypassingSnap } from "@/lib/scroll";
import AccountBadge from "@/components/AccountBadge";

// lucide-react dropped brand/logo icons — these are small local stroke icons
// (matching lucide's own visual style) so we don't need a whole extra icon
// library just for two social links.
function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/eventos", label: "Eventos" },
  { href: "#", label: "Loja" },
  { href: "/", label: "Contacto", isContacto: true },
];

export default function Navbar({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);
  const cartCount = 0;
  const [scrolled, setScrolled] = useState(false);
  const [inContactos, setInContactos] = useState(false);
  const [navTransparentZone, setNavTransparentZone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => {
      setScrolled(false);
      setInContactos(false);
      setNavTransparentZone(false);
    }, 0);
    const container = document.getElementById('snap-container');
    const handleScroll = () => {
      const scrollY = container ? container.scrollTop : window.scrollY;
      setScrolled(scrollY > 100);
      const contactos = document.getElementById('contactos');
      if (contactos) {
        setInContactos(scrollY >= contactos.offsetTop - 200);
      } else {
        setInContactos(false);
      }
      const isWithin = (el: HTMLElement | null) =>
        !!el && scrollY >= el.offsetTop - 50 && scrollY < el.offsetTop + el.offsetHeight - 50;
      const fundadores = document.getElementById('fundadores');
      const objetivos = document.getElementById('sobre');
      setNavTransparentZone(isWithin(fundadores) || isWithin(objetivos));
    };
    const target: Window | HTMLElement = container || window;
    target.addEventListener("scroll", handleScroll);
    return () => target.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const getLinkClass = (link: typeof links[number]) => {
    if (link.isContacto) {
      return inContactos ? "text-primary" : "text-foreground hover:text-primary";
    }
    if (inContactos) {
      return "text-foreground hover:text-primary";
    }
    const isActive = link.href !== "/" && (pathname === link.href || pathname.startsWith(`${link.href}/`));
    return isActive ? "text-primary" : "text-foreground hover:text-primary";
  };

  return (
    <nav className={`w-full fixed top-0 left-0 right-0 z-50 px-6 ${scrolled ? "py-3 lg:pt-2" : "py-6 lg:py-7"} overflow-visible transition-all duration-300 ${
  scrolled ? (navTransparentZone ? "bg-transparent border-transparent" : "bg-black/25 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]") : "bg-transparent border-transparent"
}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">

        {/* Logo Desktop */}
        <Link href="/" onClick={() => {
          const container = document.getElementById('snap-container');
          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }} className="hidden lg:block shrink-0 z-10">
          <Image src="/logo.png" alt="Fumarentas do Asfalto" width={170} height={170} loading="eager"
            className={`object-contain transition-all duration-300 hover:scale-105 drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)] ${scrolled ? "mb-0 w-25! h-25!" : "-mb-25 w-42.5! h-42.5!"}`} />
        </Link>

        {/* Logo Mobile */}
        <Link href="/" onClick={() => {
          const container = document.getElementById('snap-container');
          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }} className="lg:hidden absolute left-6 top-1/3 z-10">
          <Image src="/logo.png" alt="Fumarentas do Asfalto" width={135} height={135} loading="eager"
            className={`object-contain drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)] transition-all duration-300 ${scrolled ? "w-16! h-16!" : "w-33.75! h-33.75!"}`}/>
        </Link>

        {/* Links Desktop */}
        <ul className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          {links.map((link) => (
            <li key={link.label}>
              <Link href={link.href}
              onClick={(e) => {
                if (link.isContacto) {
                  e.preventDefault();
                  scrollToContactosBypassingSnap();
                  return;
                }
                if (link.href === pathname) {
                  e.preventDefault();
                  const container = document.getElementById('snap-container');
                  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.8)] hover:drop-shadow-[0_0_10px_rgba(var(--primary-rgb),5)] transition-all text-lg font-bold uppercase tracking-wide hover:tracking-widest ${getLinkClass(link)}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Direita: Carrinho + Login */}
        <div className="flex items-center lg:gap-8 gap-4 shrink-0 ml-auto lg:ml-0">
          <Link href="#" className="relative text-foreground hover:text-primary transition-all hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.7)]">
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          </Link>
          <a href="https://www.facebook.com/profile.php?id=61569646445995" target="_blank" className="hidden lg:block text-foreground hover:text-primary transition-all hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.7)]">
            <FacebookIcon size={25} />
          </a>
          <a href="https://www.instagram.com/fumarentas_do_asfalto/#" target="_blank" className="hidden lg:block text-foreground hover:text-primary transition-all hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.7)]">
            <InstagramIcon size={25} />
          </a>
          {session ? (
            <AccountBadge session={session} className="hidden lg:flex" />
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button variant="outline" size="sm" className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-widest text-sm px-6 py-5 shadow-[0_0_6px_rgba(var(--primary-rgb),0.8)] hover:shadow-[0_0_16px_rgba(var(--primary-rgb),3.8)] transition-all">
                Login
              </Button>
            </Link>
          )}
          <a href="https://www.facebook.com/profile.php?id=61569646445995" target="_blank" className="lg:hidden text-foreground hover:text-primary transition-all">
            <FacebookIcon size={28} />
          </a>
          <a href="https://www.instagram.com/fumarentas_do_asfalto/#" target="_blank" className="lg:hidden text-foreground hover:text-primary transition-all">
            <InstagramIcon size={28} />
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden p-0 text-foreground hover:text-primary transition-colors">
              <Menu size={32} />
            </SheetTrigger>
            <SheetContent side="right" className="w-35! bg-black/70 backdrop-blur-sm border-white/10 [&>button]:text-orange-500 [&>button]:scale-150 [&>button]:stroke-3">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
              <ul className="flex flex-col gap-2 mt-15 items-center">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} 
                    onClick={(e) => {
                      setOpen(false);
                      if (link.isContacto) {
                        e.preventDefault();
                        setTimeout(scrollToContactosBypassingSnap, 300);
                        return;
                      }
                      if (link.href === pathname) {
                        e.preventDefault();
                        setTimeout(() => {
                          const container = document.getElementById('snap-container');
                          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                          else window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 300);
                      }
                    }}
                    className={`drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.2)] hover:drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)] transition-all text-lg font-bold uppercase tracking-widest ${getLinkClass(link)}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className={session ? "mt-3" : "w-25 mt-3"}>
                  {session ? (
                    <AccountBadge session={session} onClick={() => setOpen(false)} vertical />
                  ) : (
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-widest text-lg py-5 shadow-[0_0_6px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_16px_rgba(var(--primary-rgb),0.8)] transition-all">
                        Login
                      </Button>
                    </Link>
                  )}
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}