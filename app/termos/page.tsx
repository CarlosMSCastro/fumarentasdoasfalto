import PaginaLegal from "@/components/PaginaLegal";

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos e Condições">
      <p>A utilização do site da Fumarentas do Asfalto está sujeita aos presentes Termos e Condições. Ao aceder ao site, o visitante aceita integralmente as condições aqui descritas.</p>
      <h2 className="text-white/90 text-2xl font-bold mt-8">1. Utilização do Site</h2>
      <p>O conteúdo deste site destina-se exclusivamente a fins informativos sobre as atividades da associação. É proibida a reprodução ou utilização de qualquer conteúdo sem autorização prévia.</p>
      <h2 className="text-white/90 text-2xl font-bold mt-8">2. Associação</h2>
      <p>A adesão como sócio implica o cumprimento dos estatutos da associação e o pagamento da quota anual. A associação reserva-se o direito de recusar ou cancelar adesões.</p>
      <h2 className="text-white/90 text-2xl font-bold mt-8">3. Responsabilidade</h2>
      <p>A Fumarentas do Asfalto não se responsabiliza por danos decorrentes da utilização do site ou da participação em eventos organizados pela associação.</p>
      <h2 className="text-white/90 text-2xl font-bold mt-8">4. Privacidade</h2>
      <p>O tratamento de dados pessoais é efetuado de acordo com a nossa Política de Privacidade e o Regulamento Geral de Proteção de Dados (RGPD).</p>
      <h2 className="text-white/90 text-2xl font-bold mt-8">5. Contacto</h2>
      <p>Para esclarecimentos: <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-orange-500 hover:text-orange-400">fumarentasdoasfalto@gmail.com</a></p>
    </PaginaLegal>
  );
}