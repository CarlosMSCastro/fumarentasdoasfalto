import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";
import { getHighResAvatarUrl } from "@/lib/avatar";

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface AccountBadgeProps {
  session: Session;
  className?: string;
  onClick?: () => void;
  // O menu mobile (Sheet) é estreito de mais (w-35, 140px) para caber o
  // avatar ao lado do nome sem quebrar/descentrar — empilhado por cima em
  // vez de lado a lado.
  vertical?: boolean;
}

// Avatar (foto do Google/Facebook, ou iniciais do nome como fallback para
// quem entrou por password) + nome, sem pill/borda — texto simples ao lado
// do avatar, como os outros ícones do Navbar. Link para /perfil. Usado no
// Navbar desktop e dentro do menu mobile.
export default function AccountBadge({ session, className = "", onClick, vertical = false }: AccountBadgeProps) {
  const { name, email, image } = session.user;
  const initials = getInitials(name, email);

  return (
    <Link href="/perfil" onClick={onClick}
      className={`flex text-[#f8f0d9] hover:text-primary transition-all group ${
        vertical ? "flex-col items-center text-center gap-1.5" : "items-center gap-2.5"
      } ${className}`}>
      <span className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border border-white/20 group-hover:border-primary transition-all">
        {image ? (
          <Image src={getHighResAvatarUrl(image, 100)!} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-white/10 text-white text-sm font-bold">
            {initials}
          </span>
        )}
      </span>
      <span className="font-bold uppercase tracking-wide text-sm">
        {name || "Minha Conta"}
      </span>
    </Link>
  );
}
