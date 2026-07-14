import PaginaLegal from "@/components/PaginaLegal";

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de Privacidade">
      <p>A Fumarentas do Asfalto compromete-se a proteger a privacidade dos seus membros e visitantes, em conformidade com o Regulamento Geral de Proteção de Dados (RGPD).</p>
      <h2 className="text-white/90 text-xl font-bold mt-8">1. Dados Recolhidos</h2>
      <p>Recolhemos dados como nome, endereço de email e morada, fornecidos voluntariamente no processo de inscrição como sócio ou através do formulário de contacto.</p>
      <h2 className="text-white/90 text-xl font-bold mt-8">2. Finalidade</h2>
      <p>Os dados recolhidos destinam-se exclusivamente à gestão de sócios, comunicação de eventos e atividades da associação.</p>
      <h2 className="text-white/90 text-xl font-bold mt-8">3. Armazenamento</h2>
      <p>Os dados são armazenados de forma segura e não são partilhados com terceiros sem consentimento, exceto quando exigido por lei.</p>
      <h2 className="text-white/90 text-xl font-bold mt-8">4. Direitos</h2>
      <p>O titular dos dados tem direito a aceder, retificar ou eliminar os seus dados pessoais a qualquer momento, mediante pedido para <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-orange-500 hover:text-orange-400">fumarentasdoasfalto@gmail.com</a>.</p>
      <h2 className="text-white/90 text-xl font-bold mt-8">5. Contacto</h2>
      <p>Para questões relacionadas com a privacidade: <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-orange-500 hover:text-orange-400">fumarentasdoasfalto@gmail.com</a></p>
    </PaginaLegal>
  );
}