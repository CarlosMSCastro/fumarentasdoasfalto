# Fumarentas do Asfalto

Site oficial da associação de motociclismo Fumarentas do Asfalto — substitui o site anterior em Wix por uma plataforma própria, com loja, gestão de sócios e um painel de administração completo.

**[fumarentasdoasfalto.com](https://fumarentasdoasfalto.com)**

## Funcionalidades

- **Login com Google e Meta** — autenticação OAuth (Google e Facebook, app aprovada em App Review), além de email/password
- **Pagamentos reais na loja** — checkout integrado com a Eupago, Multibanco e MB WAY
- **Confirmação de pagamento por webhook** — a Eupago notifica o site (webhook assinado, HMAC-SHA256) assim que um pagamento é confirmado
- **Recibos em PDF automáticos** — gerados e anexados por email a cada encomenda paga
- **Emails transacionais automáticos** — confirmações, referências de pagamento, boas-vindas e notificações internas, via Resend
- **Integração com o Quotagest** — liga automaticamente a conta do site à ficha de sócio (quotas, dados, estado) por email
- **Painel de administração** — gestão de encomendas, sócios e utilizadores, e um CMS próprio para todo o conteúdo do site (eventos, produtos, fundadores, textos)
- **Comunicados** — envio de email em massa aos sócios diretamente do painel de admin
- **Timeline de eventos** — histórico da associação por ano, com carrossel de fotos e vista detalhada por evento
- **Homepage com scroll-snap** — hero, objetivos e contactos como secções de scroll vertical, com mapa do Google Maps integrado

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · shadcn/ui · Auth.js (Credentials/Google/Facebook) · Neon Postgres + Drizzle ORM · Vercel Blob · Resend · Eupago · Sentry · Vercel

## Segurança

Passado por várias rondas de auditoria (manual + scan automatizado OWASP ZAP):

- Rate limiting nas rotas sensíveis (login, registo, checkout) via Vercel Firewall
- Content-Security-Policy restritiva; chave da API do Google Maps limitada por domínio
- Proteção contra enumeração de utilizadores no registo
- Upload de imagens validado (bloqueio de SVG, que pode conter scripts embutidos)
- Idempotência no checkout — evita encomendas e pagamentos duplicados
- Monitorização de erros (Sentry) configurada para nunca capturar dados sensíveis (passwords, cookies de sessão, tokens)
- GitHub Secret Scanning + Push Protection e Dependabot ativos
- Nenhum segredo alguma vez foi commitado para este repositório — chaves e credenciais vivem só nas variáveis de ambiente da Vercel
