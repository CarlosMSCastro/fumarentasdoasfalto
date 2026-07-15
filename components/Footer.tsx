import Link from "next/link";

export default function Footer() {
  return (
    <div className="py-6 text-center text-white/40 text-sm relative z-10">
      <div className="flex justify-center gap-3 mb-2">
        <Link href="/termos" className="hover:text-white/70 transition-colors">Termos e Condições</Link>
        <Link href="/privacidade" className="hover:text-white/70 transition-colors">Política de Privacidade</Link>
        <Link href="/cookies" className="hover:text-white/70 transition-colors">Política de Cookies</Link>
      </div>
      © {new Date().getFullYear()} Fumarentas do Asfalto. Todos os direitos reservados.
    </div>
  );
}