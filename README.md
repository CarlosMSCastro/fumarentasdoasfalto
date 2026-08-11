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
- **Emails transacionais** — Resend (reset de password, confirmação de sócio, confirmação de encomenda, referência Multibanco)
- **Upload de ficheiros** — Vercel Blob (foto de perfil)
- **Pagamentos** — Eupago (Multibanco e MB WAY integrados e a funcionar; Cartão de crédito não disponível nesta conta — ver Backlog)
- **Gestão de sócios** — Quotagest (plataforma externa) — o site lê dados de sócio (estado da quota, data de entrada) via API própria, não gere sócios

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
- Pagamento via Eupago (`lib/eupago.ts`), canal Eupago dedicado à Loja (separado do canal usado para as quotas do Quotagest):
  - **Multibanco** — gera referência (Entidade/Referência/Valor), mostrada no ecrã de confirmação, enviada por email, e consultável depois em `/perfil`
  - **MB WAY** — pede pagamento diretamente para o número indicado (campo próprio, separado do telefone de contacto)
  - **Cartão** — não disponível nesta conta Eupago (seria um produto à parte, seria preciso contratar); código existe (`gerarLinkPagamentoCartao`) mas está desligado do checkout
- Confirmação de pagamento via webhook (`app/api/pagamentos/eupago-callback`), assinado (`X-Signature`, HMAC-SHA256) — marca a encomenda como paga e envia email de confirmação
- **Não implementado:** emissão de fatura ao cliente (a Eupago não faz isto automaticamente; precisaria de uma ferramenta de faturação certificada à parte, ex. InvoiceXpress/Vendus/Moloni)

## Autenticação

Auth.js (`next-auth` v5 beta, config em `auth.ts`), três providers: Credentials (bcrypt), Google e Facebook (OAuth, contas ligadas automaticamente por email já verificado pelo provider). Sessão sempre JWT (obrigatório quando há Credentials provider). `DrizzleAdapter` persiste users/accounts/verification-tokens no Postgres. Resend envia emails de reset de password / confirmação de troca de email.

**Proteções de segurança:**
- **Rate limiting** via regra no Vercel Firewall (10 pedidos/60s por IP) em `/login`, `/registo`, `/esqueci-me-da-password`, `/perfil`
- **Registo sem enumeração de utilizadores** — `registar()` (`app/actions/auth.ts`) não faz login automático e devolve sempre a mesma resposta genérica, exista ou não conta com o email indicado (hash da password corre sempre, para o tempo de resposta não denunciar qual dos casos aconteceu)
- **Upload de foto de perfil** (`atualizarFoto`, `app/actions/perfil.ts`) só aceita JPEG/PNG/WEBP/GIF — SVG bloqueado (podia conter script embutido)
- Cada página protegida (`/perfil`, `/checkout`) verifica a sessão individualmente no próprio ficheiro — **ainda não há um `proxy.ts` central** que cubra automaticamente páginas novas (ver Backlog)

## Perfil e Sócio

`/perfil` mostra dados da conta (nome, foto, morada, password), histórico de encomendas (colapsável, com dados de pagamento por encomenda), e uma secção "Sócio" que tenta corresponder a conta ao registo de sócio no Quotagest automaticamente por email (com pesquisa manual por número de sócio/NIF como alternativa) — mostra estado da quota e data de entrada. Esta ligação é só de leitura; o site não gere sócios nem quotas.

## Backlog / Por fazer

- **Cartão de crédito (Eupago)** — precisaria de contratar esse produto à parte com a Eupago
- **Faturação da Loja** — nenhuma fatura é emitida aos clientes; precisa de ferramenta certificada à parte
- **Botão "Pagar quotas"** em `/perfil` — só leitura: mostrar a referência já emitida pelo Quotagest (sem gerar uma nova se estiver em falta/expirada, decisão deliberada para manter simples)
- **Migração de domínio** para o `.com` definitivo da associação (afeta `FROM` dos emails, verificação de domínio do Facebook, `NEXT_PUBLIC_APP_URL`)
- **Login por Facebook para todos** — depende da migração de domínio + possivelmente Meta App Review (app está em modo de desenvolvimento)
- **Marca/modelo de mota** no perfil — ainda não existe no schema
- **Email de boas-vindas** no registo — adiado por escolha, registo já funciona sem ele
- **Middleware central de autenticação (`proxy.ts`)** — hoje cada página protegida verifica a sessão manualmente; um `proxy.ts` central adicionaria uma rede de segurança para páginas novas que se esqueça de proteger, mas não substituiria as verificações já existentes (que continuam a ser a proteção real, inclusive para Server Actions). Risco de implementar: mal configurado pode bloquear o site inteiro (corre em todas as rotas por definição) ou criar loop de redirecionamento se `/login` ficar incluído por engano.
- **Notificações internas por email** (nova encomenda, novo registo) para `fumarentasdoasfalto@gmail.com` — ainda não implementado
- **Rever templates dos emails** (`lib/email.ts`) — hoje são só HTML simples sem marca visual nenhuma (sem logo, sem cores do site); valeria a pena um template com a identidade visual da associação
- **Backoffice** para o Sr. Joaquim gerir produtos/eventos (considerado CMS headless tipo Sanity — painel de encomendas também entraria aí como ferramenta customizada, lendo da nossa Postgres, não como documentos nativos do Sanity)
- Integração com Facebook Graph API para puxar eventos automaticamente (avaliado — requer App Review da Meta, complexidade elevada)
