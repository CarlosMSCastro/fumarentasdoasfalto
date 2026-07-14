export default function Footer() {
  return (
    <div className="py-6 text-center text-white/40 text-sm relative z-10">
      <div className="flex justify-center gap-3 mb-2">
        <a href="/termos" className="hover:text-white/70 transition-colors">Termos e Condições</a>
        <a href="/privacidade" className="hover:text-white/70 transition-colors">Política de Privacidade</a>
        <a href="/cookies" className="hover:text-white/70 transition-colors">Política de Cookies</a>
      </div>
      © {new Date().getFullYear()} Fumarentas do Asfalto. Todos os direitos reservados.
    </div>
  );
}