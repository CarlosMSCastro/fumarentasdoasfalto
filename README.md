# Fumarentas do Asfalto

Site oficial da associação Fumarentas do Asfalto, desenvolvido como alternativa custom ao site anterior em Wix.

## Stack

- **Framework** — Next.js 15 (React) + TypeScript
- **Styling** — Tailwind CSS v4
- **Componentes** — shadcn/ui (Radix UI)
- **Ícones** — Lucide React
- **Fontes** — Rajdhani (Google Fonts)
- **Deploy** — Vercel (CI/CD automático a cada push)
- **Autenticação** — Auth.js com Google e Facebook OAuth (em desenvolvimento)
- **Base de dados** — PostgreSQL via Neon (em desenvolvimento)
- **Pagamentos** — euPago (MB Way, Multibanco) + Stripe (em desenvolvimento)
- **Email** — Resend (em desenvolvimento)
- **Gestão de sócios** — Quotagest (plataforma externa)

## O que está feito

### Identidade Visual
- Paleta de cores dark com laranja como cor primária (`#ff6b00`)
- Logo com efeito glow laranja e animação hover
- Tipografia com Rajdhani bold uppercase para consistência visual

### Navbar
- Layout responsivo — desktop e mobile com comportamentos distintos
- Logo em overflow fora da navbar em ambos os breakpoints
- Links com efeito glow e animação de tracking no hover
- Carrinho de compras com contador de itens
- Botão de Login estilizado com glow
- Menu hamburger em mobile com Sheet deslizante (shadcn)
- Links sociais (em desenvolvimento)
- Avatar do utilizador após login (em desenvolvimento)