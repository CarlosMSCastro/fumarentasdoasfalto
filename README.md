# Fumarentas do Asfalto

Site oficial da associação Fumarentas do Asfalto, desenvolvido como alternativa custom ao site anterior em Wix.

## Stack

- **Framework** — Next.js 16 (App Router) + TypeScript, React 19
- **Styling** — Tailwind CSS v4 (config em `app/globals.css`, sem `tailwind.config.*`)
- **Componentes** — shadcn/ui (`style: radix-nova`) sobre Radix UI
- **Ícones** — Lucide React
- **Fontes** — Rajdhani (Google Fonts)
- **Deploy** — Vercel, branch `main` é produção (única branch em uso, sem staging separado)
- **Mapas** — Google Maps JavaScript API (`@googlemaps/js-api-loader`), com estilo dark customizado, instância singleton persistente entre navegações
- **Autenticação** — Auth.js (`next-auth` v5 beta) — Credentials (email/password), Google e Facebook, sessões JWT, `DrizzleAdapter`
- **Base de dados** — Neon Postgres + Drizzle ORM
- **Emails transacionais** — Resend (`lib/email.ts`): reset de password, confirmação de troca de email, confirmação de sócio, confirmação de encomenda (com recibo em PDF anexado), referência Multibanco, confirmação MB WAY, boas-vindas no registo, notificações internas (novo registo/nova encomenda). Todos com o mesmo wrapper visual (logo + laranja da marca sobre cartão claro — fundo escuro evitado de propósito, por legibilidade em clientes de email)
- **Upload de ficheiros** — Vercel Blob (foto de perfil)
- **Pagamentos** — Eupago (Multibanco e MB WAY integrados e a funcionar; Cartão de crédito não disponível nesta conta — ver Backlog)
- **Gestão de sócios** — Quotagest (plataforma externa) — o site lê dados de sócio (estado da quota, data de entrada) via API própria, não gere sócios
- **Monitorização de erros** — Sentry (`@sentry/nextjs`, via Vercel Marketplace, plano gratuito, região EU), instalado pelo assistente oficial. `dataCollection` foi propositadamente restringido nos 3 ficheiros de config (`sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`) — por omissão o wizard captava cookies (inclui sessão), corpo dos pedidos (passwords em claro nos Server Actions de auth) e parâmetros da URL (tokens de reset/confirmação); ficou só o essencial (utilizador afetado + stack trace). Session Replay ativo (mascarado por omissão pelo próprio Sentry) — considerar mencionar em `/privacidade`.

## Estrutura de páginas

- `/` — Homepage (Hero + Objetivos + Contactos), com scroll snap vertical
- `/sobre` — História da associação, com vídeo/imagem de fundo
- `/eventos` — Timeline horizontal de eventos (ver secção própria abaixo)
- `/eventos/[id]` — Página completa de um evento (fallback para acesso direto/partilha; ver "Modal de eventos" abaixo)
- `/loja` — Catálogo de produtos, com carrinho
- `/checkout` — Finalizar compra (dados de contacto/morada + escolha de método de pagamento)
- `/checkout/retorno` — Página de retorno do pagamento por cartão (não usada atualmente, ver Backlog)
- `/login`, `/registo`, `/esqueci-me-da-password`, `/redefinir-password` — Autenticação (Auth.js)
- `/perfil` — Conta do utilizador: dados, morada, password, histórico de encomendas, secção "Sócio" (dados vindos do Quotagest)
- `/confirmar-email`, `/confirmar-socio` — Confirmação de troca de email / associação de conta a um registo de sócio existente
- `/termos`, `/privacidade`, `/cookies` — Páginas legais (mesmo template `PaginaLegal`)

## Identidade Visual

- Paleta dark com laranja como cor primária (`#ff6b00`), fundo `#050505`
- Logo com efeito glow laranja e animação hover
- Tipografia Rajdhani bold uppercase para consistência
- Vídeos de fumo subtis como textura de fundo em várias secções

## Navbar

- Layout responsivo — comportamentos distintos em desktop/mobile
- Logo encolhe suavemente ao fazer scroll (`scrolled` state); em `/perfil` e `/checkout`, no mobile, encolhe mais cedo (50px em vez de 100px) por serem páginas de formulário sem hero
- Links com efeito glow e link ativo a laranja consoante a rota
- Scroll suave para `/` e `#contactos` mesmo dentro do `snap-container`
- Menu hamburger em mobile com Sheet (shadcn)
- Carrinho de compras funcional (contador, `CartSheet`, liga ao `/checkout`)
- Login/conta funcional — mostra `AccountBadge` quando autenticado, botão de Login caso contrário

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

### Modal de eventos

Clicar num evento abre-o como modal sobreposto (via parallel + intercepting routes do Next — `app/@modal/(.)eventos/[id]/`) em vez de navegação de página inteira, mantendo o URL partilhável (`/eventos/[id]` funciona diretamente/num refresh). Modal e página completa partilham o mesmo conteúdo (`EventoConteudo.tsx`).

## Loja e Pagamentos

- Catálogo estático em `data/produtos.json`, carrinho em `localStorage` (`lib/cart.tsx`)
- Checkout recalcula sempre preços a partir do catálogo no servidor (nunca confia no valor vindo do cliente)
- **Entrega**: envio (portes fixos, `PORTES_EUROS` em `lib/encomendas.ts`) ou levantamento em mão (grátis, portes a 0€) — escolha guardada em `orders.metodoEntrega`, mostrada no histórico do `/perfil` e na notificação interna de nova encomenda
- Pagamento via Eupago (`lib/eupago.ts`), canal Eupago dedicado à Loja (separado do canal usado para as quotas do Quotagest):
  - **Multibanco** — gera referência (Entidade/Referência/Valor), válida por 2 dias (`data_fim` pedido à Eupago em `gerarReferenciaMultibanco`; a API só aceita data, não hora exata, por isso "2 dias" é sempre uma aproximação até ao fim desse dia), mostrada no ecrã de confirmação, enviada por email, e consultável depois em `/perfil`
  - **MB WAY** — pede pagamento diretamente para o número indicado (campo próprio, separado do telefone de contacto); cliente tem 5 minutos para confirmar na app (confirmado na documentação oficial da Eupago)
  - **Cartão** — dispensado por decisão do utilizador (não vale a pena contratar); código existe (`gerarLinkPagamentoCartao`) mas está desligado do checkout, fica só como referência
- Confirmação de pagamento via webhook (`app/api/pagamentos/eupago-callback`), assinado (`X-Signature`, HMAC-SHA256) — marca a encomenda como paga e envia email de confirmação com recibo em PDF anexado
- **Recibo em PDF** (`lib/recibo-pdf.tsx`, `@react-pdf/renderer`) — sem valor fiscal, por decisão do utilizador; gerado a partir dos dados da encomenda e anexado ao email de confirmação de pagamento (falha suave: se o PDF rebentar, o email sai na mesma, só sem anexo)

## Autenticação

Auth.js (`next-auth` v5 beta, config em `auth.ts`), três providers: Credentials (bcrypt), Google e Facebook (OAuth, contas ligadas automaticamente por email já verificado pelo provider). Sessão sempre JWT (obrigatório quando há Credentials provider). `DrizzleAdapter` persiste users/accounts/verification-tokens no Postgres. Resend envia emails de reset de password / confirmação de troca de email.

**Proteções de segurança:**
- **Rate limiting** via regra no Vercel Firewall (10 pedidos/60s por IP) em `/login`, `/registo`, `/esqueci-me-da-password`, `/perfil`
- **Registo sem enumeração de utilizadores** — `registar()` (`app/actions/auth.ts`) não faz login automático e devolve sempre a mesma resposta genérica, exista ou não conta com o email indicado (hash da password corre sempre, para o tempo de resposta não denunciar qual dos casos aconteceu)
- **Upload de foto de perfil** (`atualizarFoto`, `app/actions/perfil.ts`) só aceita JPEG/PNG/WEBP/GIF — SVG bloqueado (podia conter script embutido)
- Cada página protegida (`/perfil`) verifica a sessão individualmente no próprio ficheiro; `proxy.ts` na raiz do projeto reforça isso como rede de segurança central (matcher só cobre `/perfil` — `/checkout` não exige login de propósito, é guest-friendly). Não substitui as verificações já existentes, inclusive nas Server Actions (ver nota em `proxy.ts`)

## Perfil e Sócio

`/perfil` mostra dados da conta (nome, foto, morada, password), histórico de encomendas (colapsável, com dados de pagamento por encomenda), e uma secção "Sócio" que tenta corresponder a conta ao registo de sócio no Quotagest automaticamente por email (com pesquisa manual por número de sócio/NIF como alternativa) — mostra estado da quota e data de entrada. Esta ligação é só de leitura; o site não gere sócios nem quotas.

## Backlog / Por fazer

- ~~**Cartão de crédito (Eupago)**~~ — dispensável (decisão do utilizador, 2026-08-11); precisaria de contratar esse produto à parte com a Eupago, não vale a pena
- **Botão "Pagar quotas"** em `/perfil` — em espera: auditoria à API real do Quotagest (2026-08-11) mostrou que as referências Multibanco podem não ser geradas automaticamente como o Sr. Joaquim descreveu — à espera de confirmação dele antes de implementar
- **Migração de domínio** para o `.com` definitivo da associação (afeta `FROM` dos emails, verificação de domínio do Facebook, `NEXT_PUBLIC_APP_URL`)
- **Login por Facebook para todos** — depende da migração de domínio + possivelmente Meta App Review (app está em modo de desenvolvimento)
- **Backoffice** para o Sr. Joaquim gerir produtos/eventos (considerado CMS headless tipo Sanity — painel de encomendas também entraria aí como ferramenta customizada, lendo da nossa Postgres, não como documentos nativos do Sanity)
- Integração com Facebook Graph API para puxar eventos automaticamente (avaliado — requer App Review da Meta, complexidade elevada)
