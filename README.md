# Fumarentas do Asfalto

Site oficial da associação Fumarentas do Asfalto, desenvolvido como alternativa custom ao site anterior em Wix.

## Stack

- **Framework** — Next.js 16 (App Router) + TypeScript
- **Styling** — Tailwind CSS v4
- **Componentes** — shadcn/ui (Radix UI)
- **Ícones** — Lucide React
- **Fontes** — Rajdhani (Google Fonts)
- **Deploy** — Vercel (branch `main`), com branch `test` para staging
- **Mapas** — Google Maps JavaScript API (`@googlemaps/js-api-loader`), com estilo dark customizado
- **Autenticação** — Auth.js com Google, Facebook e email/password (planeado)
- **Base de dados** — a definir (loja terá gestão própria de produtos/encomendas)
- **Pagamentos** — Eupago/IfThenPay (MB WAY, Multibanco) — pesquisado, ainda não integrado
- **Gestão de sócios** — Quotagest (plataforma externa, apenas linkado)

## Estrutura de páginas

- `/` — Homepage (Hero + Objetivos + Contactos), com scroll snap vertical
- `/sobre` — História da associação, com vídeo/imagem de fundo
- `/eventos` — Timeline horizontal de eventos (ver secção própria abaixo)
- `/termos`, `/privacidade`, `/cookies` — Páginas legais (mesmo template `PaginaLegal`)
- `/loja` — Planeada, ainda não desenvolvida
- `/login` — Planeada, ainda não desenvolvida

## Identidade Visual

- Paleta dark com laranja como cor primária (`#ff6b00`), fundo `#050505`
- Logo com efeito glow laranja e animação hover
- Tipografia Rajdhani bold uppercase para consistência
- Vídeos de fumo subtis como textura de fundo em várias secções

## Navbar

- Layout responsivo — comportamentos distintos em desktop/mobile
- Logo encolhe suavemente ao fazer scroll (`scrolled` state)
- Links com efeito glow e link ativo a laranja consoante a rota
- Scroll suave para `/` e `#contactos` mesmo dentro do `snap-container`
- Menu hamburger em mobile com Sheet (shadcn), largura limitada (`w-[75%]`)
- Carrinho de compras (contador, sem lógica de loja ainda)
- Botão de Login estilizado (sem funcionalidade ainda)

## Homepage — Scroll Snap

- `#snap-container` com `snap-y snap-mandatory` — Hero, Objetivos e Contactos como secções de snap
- Setas de scroll (`ScrollIndicator`) reutilizáveis, com scroll customizado para contornar o comportamento do snap com `scrollSnapType` temporário

### Hero
- Vídeo de fundo com overlay horizontal + vertical
- Título, texto, 2 CTAs ("Novo Sócio", "Portal do Sócio")
- Scroll indicator para `#sobre`

### Objetivos
- 2 vídeos de fumo sobrepostos (desfasados, loop suave)
- 3 cards (`ObjetivosDesktop`/`ObjetivosMobile`) com hover expansível, ligando a `/eventos` ou scroll para contactos
- Scroll indicator para `#contactos`

### Contactos (`ContactosSection`)
- Grid responsivo com horário, email, morada e CTA "Quer ser membro?"
- Mapa Google Maps com estilo dark customizado (laranja nas estradas), instância persistente entre navegações (evita reload)
- Footer com copyright e links legais

## Página Eventos

- Timeline horizontal com scroll customizado (auto-scroll ao aproximar o rato das bordas)
- Cards estilo "polaroid" com rotação alternada, agrupados por ano
- Eventos "destaque" maiores (Fundação, 1º e 2º Aniversário)
- Hover: card expande, mostra carrossel automático de fotos (crossfade a cada 1.8s), mês correspondente acende a laranja
- Indicador de ano fixo, atualiza consoante o scroll
- Dados centralizados em `data/eventos.json`, fotos em `public/eventos/{pasta}/`
- **Limitação conhecida:** o card expandido em hover empurra ligeiramente o layout para baixo (não foi possível eliminar completamente sem recorrer a Portal do React — pendente)

## Páginas Legais

- Componente `PaginaLegal.tsx` reutilizado por Termos, Privacidade e Cookies
- Estrutura: vídeo de fundo + texto + `ContactoSection` + `Footer`

## Backlog / Por fazer

- Loja (produtos, carrinho, checkout, pagamento)
- Sistema de login (Google, Facebook, email/password)
- Perfil de utilizador (foto, morada, marca/modelo de mota, histórico de encomendas)
- Integração com Facebook Graph API para puxar eventos automaticamente (avaliado — requer App Review da Meta, complexidade elevada)
- Backoffice para o Sr. Joaquim gerir produtos/eventos (considerado CMS headless tipo Sanity)
- Migração de domínio próprio
