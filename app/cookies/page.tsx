import PaginaLegal from "@/components/PaginaLegal";

export default function CookiesPage() {
  return (
    <PaginaLegal titulo="Política de Cookies">
      <p>O site da Fumarentas do Asfalto utiliza cookies para melhorar a experiência de navegação dos seus visitantes.</p>
      <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">1. O que são Cookies</h2>
      <p>Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita o nosso site. Permitem que o site reconheça o seu dispositivo em visitas futuras.</p>
      <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">2. Tipos de Cookies Utilizados</h2>
      <p>Utilizamos cookies técnicos essenciais para o funcionamento do site, e cookies de análise de tráfego através do Google Analytics.</p>
      <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">3. Cookies de Terceiros</h2>
      <p>O Google Analytics pode utilizar cookies próprios para análise de utilização do site. As suas práticas estão sujeitas à política de privacidade da Google.</p>
      <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">4. Gestão de Cookies</h2>
      <p>Pode configurar o seu browser para recusar cookies, embora isso possa afetar o funcionamento de algumas funcionalidades do site.</p>
      <h2 className="text-white/90 text-base md:text-xl font-bold mt-8">5. Contacto</h2>
      <p>Para questões relacionadas com cookies: <a href="mailto:fumarentasdoasfalto@gmail.com" className="text-orange-500 hover:text-orange-400">fumarentasdoasfalto@gmail.com</a></p>
    </PaginaLegal>
  );
}