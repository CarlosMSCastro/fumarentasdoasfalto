import Image from "next/image";
import Footer from "@/components/Footer";
import SmokeVideo from "@/components/SmokeVideo";

// Fundo partilhado por /login, /registo, /esqueci-me-da-password e
// /redefinir-password — mesmo wallpaper/gradientes/fumo que a FoundersSection
// usa, mas sem o ContactosSection completo (só o Footer, como estas páginas
// são de formulário, não precisam de horário/mapa/etc.).
interface AuthPageBackgroundProps {
  children: React.ReactNode;
  // "end" alinha o conteúdo com a ponta direita da navbar (mesmo contentor
  // max-w-7xl mx-auto que o <Navbar /> usa), em vez de centrado na página.
  align?: "center" | "end";
  // "start" alinha ao topo em vez de centrar verticalmente — usado em
  // páginas com conteúdo de altura variável (ex: perfil, com secções
  // colapsáveis), senão o conteúdo "recentra" e salta sempre que algo
  // expande/colapsa.
  verticalAlign?: "center" | "start";
  // false quando a página já traz o próprio Footer a seguir (ex: perfil,
  // que agora encosta a <ContactosSection /> — essa secção já inclui um
  // Footer, então o daqui ficaria duplicado).
  footer?: boolean;
  // true reduz o py-24 no mobile (py-8) — só faz sentido em páginas sem
  // <Navbar /> fixa a sobrepor o topo (ex: /admin), senão o conteúdo fica
  // colado/tapado por ela. As páginas de auth normais (login, perfil, etc.)
  // continuam com o py-24 de sempre.
  compactPaddingMobile?: boolean;
  // true usa um contentor mais largo que o max-w-7xl (que existe para
  // alinhar com o <Navbar />) — só faz sentido em páginas sem Navbar (ex:
  // painel de admin), onde não há nada para alinhar e o painel/tabelas
  // beneficiam do espaço extra (ex: a fila de filtros de /admin/encomendas
  // com muitas opções de produto, que senão parte para uma segunda linha).
  wide?: boolean;
}

export default function AuthPageBackground({
  children,
  align = "center",
  verticalAlign = "center",
  footer = true,
  compactPaddingMobile = false,
  wide = false,
}: AuthPageBackgroundProps) {
  return (
    <div className="relative min-h-dvh w-full flex flex-col overflow-hidden">
      <div className="fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <Image
          src="/sobremimwallpaper2.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-l from-black/55 via-black/65 to-black/65" />
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/30 to-black/65" />
        <div className="absolute inset-0 bg-linear-to-t from-black/0 via-black/30 to-black/75" />
        <SmokeVideo className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none mix-blend-screen" />
      </div>

      <div
        className={`relative z-10 flex-1 flex px-6 ${compactPaddingMobile ? "py-8 sm:py-24" : "py-24"} ${
          verticalAlign === "start" ? "items-start" : "items-center"
        }`}
      >
        <div className={`w-full ${wide ? "max-w-[100rem]" : "max-w-7xl"} mx-auto flex ${align === "end" ? "justify-end" : "justify-center"}`}>
          {children}
        </div>
      </div>
      {footer && <Footer />}
    </div>
  );
}
