# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About

Official site for "Fumarentas do Asfalto" (a motorcycle association), replacing a previous Wix site. Content and copy are in Portuguese (pt).

## Before writing Next.js code

This project pins `next@16.2.6`, a version newer than most training data. **Read `node_modules/next/dist/docs/` before using any Next.js API you're not 100% sure about** — App Router conventions, config options, and data-fetching APIs may differ from what you expect. `app/template.tsx` (a page-transition fade-in) and the `app/@modal/` parallel + intercepting route (see "Eventos" below) are examples of files whose purpose isn't obvious without knowing current App Router special-file conventions.

`app/template.tsx` uses a manual `transition-opacity` + mount-triggered state toggle, **not** tw-animate-css's `animate-in` keyframe utility, on purpose: a CSS `animation`/`transition` that touches `transform` (which tw-animate-css's shared `enter` keyframe always does, even for a plain `fade-in`, at identity values) makes that element a new *containing block* for any `position: fixed` descendant for as long as the animation is active. Next applies the root template to **every** parallel-route slot independently (not just `children`), so `EventoModal` (rendered through `app/@modal/`) was inheriting this template too, and its `fixed inset-0` was resolving against the template's box instead of the viewport for the first ~1s of every navigation — a real, reproducible bug, not a dev-mode artifact. `EventoModal` also renders through a `createPortal(..., document.body)` for the same underlying reason: it fully escapes the template tree (and its per-navigation opacity transition) rather than depending on the transition being transform-free forever.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test suite is configured.

## Stack

- Next.js 16 (App Router) + TypeScript, React 19
- Tailwind CSS v4 (config lives in `app/globals.css`, no `tailwind.config.*`)
- shadcn/ui (`style: radix-nova`) on top of Radix UI — components added under `components/ui/`; aliases are defined in `components.json` (`@/components`, `@/lib`, `@/components/ui`, etc.)
- Rajdhani (Google Font) as the primary UI font, loaded in `app/layout.tsx`
- Google Maps JavaScript API via `@googlemaps/js-api-loader`, requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
- Auth.js (`next-auth` v5 beta) + Drizzle ORM against Neon Postgres — see "Authentication" below
- Deploy: Vercel, `main` branch is production (only branch currently in use — no separate staging branch)

## Architecture

### Persistent Google Map instance

`components/Map.tsx` keeps its `google.maps.Map` instance in a **module-level variable** (`mapInstance`, outside the component), not in React state. `app/layout.tsx` renders one `<Map />` inside a hidden, fixed, off-screen div so the map initializes once at the root and survives client-side navigation. Any page that wants to show the map (currently `ContactosSection`) must re-parent the *existing* `mapDiv` into its own ref rather than creating a new map — see the `if (mapInstance)` branch in `Map.tsx`. If you need a second, independent map instance somewhere, this singleton pattern will fight you; plan around it explicitly.

### Homepage scroll-snap

`app/page.tsx` wraps `HeroSection`, `ObjetivosSection`, and `ContactosSection` in a `#snap-container` (`snap-y snap-mandatory`, `h-dvh`, `overflow-y-scroll`). `ScrollIndicator` is a reusable arrow component that just calls `scrollIntoView` on its target — it does **not** touch `scrollSnapType`. The snap-bypass workaround (temporarily setting `scrollSnapType = 'none'` so a programmatic scroll to `#contactos` isn't intercepted by the snap points, then restoring it on `scrollend`) lives in `lib/scroll.ts` (`scrollToContactosBypassingSnap`), used by `Navbar` and `ObjetivosDesktop`/`ObjetivosMobile` — see those call sites before changing snap behavior. Other pages (`/sobre`, `/eventos`, legal pages) are normal (non-snap) scroll pages.

### Eventos (events timeline)

- Data lives in `data/eventos.json` — flat array of event objects (`id`, `titulo`, `local`, `data`, `descricao`, `destaque`, `pasta`, `capa`, `fotos`). Photos live in `public/eventos/{pasta}/`, referenced by filename in `fotos`.
- `destaque: true` marks milestone events (foundation, anniversaries) that render larger in the timeline.
- `components/EventosTimeline.tsx` renders a horizontal timeline grouped by year, with custom auto-scroll near the viewport edges, polaroid-style alternating card rotation, and an on-hover auto-advancing photo carousel. A fixed year indicator updates based on scroll position.
- Known layout limitation (see README): the hover-expanded card pushes layout down slightly; a full fix would need a React Portal and hasn't been done.

### Authentication

Auth.js (`next-auth` v5 beta, config in `auth.ts` at the repo root) is wired up and working — don't assume it's unimplemented. Three providers: `Credentials` (email/password, hashed with `bcryptjs`), `Google`, and `Facebook` (both OAuth, `allowDangerousEmailAccountLinking: true` since both providers pre-verify email). Session strategy is forced to `jwt` because the `Credentials` provider is present (Auth.js doesn't support DB sessions with it) — there's deliberately no `session` table in the schema. `DrizzleAdapter` persists users/accounts/verification-tokens to Neon Postgres via Drizzle ORM (`lib/db/schema.ts`, `lib/db/index.ts`); `resend` (`lib/email.ts`) sends the verification/reset-password emails, reusing the `verificationToken` table for both flows. User-facing pages: `/login`, `/registo`, `/esqueci-me-da-password`, `/redefinir-password`, `/perfil` (+ `PerfilForm.tsx`). All four auth pages share `components/AuthPageBackground.tsx` for their background treatment.

### Eventos modal (soft-navigation photo view)

Clicking an event in `EventosTimeline` opens it as a modal overlay instead of a full page navigation, via Next's parallel + intercepting routes: `app/@modal/(.)eventos/[id]/page.tsx` intercepts the `/eventos/[id]` route and renders `components/EventoModal.tsx` (a portal-based overlay) instead of the full page — but a direct link or page refresh still hits the real `app/eventos/[id]/page.tsx` (`EventoPageClient.tsx`), so the URL stays shareable. Both the modal and the full-page fallback render their photo/caption content through the shared `components/EventoConteudo.tsx`. `app/@modal/default.tsx` (required by Next for every parallel-route slot) renders `null` so the slot is empty on any route that isn't intercepted. See the `app/template.tsx` note above for why `EventoModal` needs a `createPortal` — don't reintroduce a `fixed`-positioned element inside the normal `children` tree without accounting for that.

### Legal pages

`/termos`, `/privacidade`, `/cookies` all render through the shared `components/PaginaLegal.tsx` template (background video + text + `ContactosSection` + `Footer`) rather than each having bespoke markup — add new legal-style pages the same way instead of duplicating the layout.

### Desktop/mobile split components

Some sections have separate desktop/mobile implementations rather than one responsive component (e.g. `ObjetivosDesktop.tsx` / `ObjetivosMobile.tsx`, both used by `ObjetivosSection.tsx`). Check for this pattern before assuming a single component handles both breakpoints.

## Not yet implemented
Per the README backlog: loja (store/cart/checkout/payment), Facebook Graph API event sync (evaluated, blocked on Meta App Review complexity), **Sanity as the headless CMS backoffice for managing products/events/founders**. Auth (login/registo/perfil, see "Authentication" above) **is** implemented — don't assume otherwise. A payment provider (Eupago/IfThenPay) has been researched but nothing is wired up — don't assume payment infrastructure exists.

## Content strategy
Content that will eventually be managed via Sanity (events, founders, products) should be structured with that migration in mind: keep data shape simple and flat (e.g. arrays of objects with clear field names), separate from component logic, so swapping a static array for a Sanity fetch later is a small change, not a rewrite.

## Regras de comportamento
- **Nunca faças `git commit` (nem `push`) por iniciativa própria — nem depois de terminar uma tarefa, nem "para não perder o trabalho". Só commits quando o utilizador pedir explicitamente essa ação, nessa conversa.**
- Não tentes redimensionar a janela física do browser (é bloqueado por segurança e causa loops inúteis)
- Para testar diferentes tamanhos de ecrã, usa emulação de viewport/dispositivo, não resize de janela
- Evita múltiplos screenshots sucessivos durante ajustes — implementa, depois faz UMA verificação visual final