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

- Data lives in the `evento`/`evento_foto` tables (Drizzle, `lib/db/schema.ts`), managed through `/admin/conteudo/eventos` — see "CMS de conteúdo" below. `lib/eventos.ts` exposes `getEventos()` (public, only `mostrar: true`) and `getTodosEventos()`/`getEventoByIdAdmin()` (admin, everything). `Evento.fotos` is an array of full URLs (either legacy `/eventos/{pasta}/...` paths kept from the pre-CMS seed, or Vercel Blob URLs for anything uploaded since) — never build a path by hand from a folder+filename, the URL is always already complete.
- `destaque: true` marks milestone events (foundation, anniversaries) that render larger in the timeline — migrated 1:1 from the old data, no admin UI edits it.
- `mostrar: false` hides an event from both the timeline and its own `/eventos/[id]` page (treated as "doesn't exist" — same "not found" UI as a bad id, not a partial hide).
- `components/EventosTimeline.tsx` renders a horizontal timeline grouped by year, with custom auto-scroll near the viewport edges, polaroid-style alternating card rotation, and an on-hover auto-advancing photo carousel. A fixed year indicator updates based on scroll position. It receives `eventos` as a prop from `app/eventos/page.tsx` (a Server Component) — it used to call `getEventos()` at module scope itself, which stopped working once that function needed a DB round-trip.
- Known layout limitation (see README): the hover-expanded card pushes layout down slightly; a full fix would need a React Portal and hasn't been done.

### Authentication

Auth.js (`next-auth` v5 beta, config in `auth.ts` at the repo root) is wired up and working — don't assume it's unimplemented. Three providers: `Credentials` (email/password, hashed with `bcryptjs`), `Google`, and `Facebook` (both OAuth, `allowDangerousEmailAccountLinking: true` since both providers pre-verify email). Session strategy is forced to `jwt` because the `Credentials` provider is present (Auth.js doesn't support DB sessions with it) — there's deliberately no `session` table in the schema. `DrizzleAdapter` persists users/accounts/verification-tokens to Neon Postgres via Drizzle ORM (`lib/db/schema.ts`, `lib/db/index.ts`); `resend` (`lib/email.ts`) sends the verification/reset-password emails, reusing the `verificationToken` table for both flows. User-facing pages: `/login`, `/registo`, `/esqueci-me-da-password`, `/redefinir-password`, `/perfil` (+ `PerfilForm.tsx`). All four auth pages share `components/AuthPageBackground.tsx` for their background treatment.

### Pagar Quota (`/perfil`)

A member with an overdue quota (`socio.quotaEmDia === false`) sees a "Pagar Quota" section in `PerfilForm.tsx` (`components/PagarQuotaForm.tsx`), backed by its own `quota_pagamento` table and `app/actions/quota.ts`'s `pedirPagamentoQuota`. **This is deliberately a separate table from `orders`**, not a store purchase — the amount is always the member's live Quotagest debt (never client-chosen), and it goes through the Loja's own Eupago channel (`gerarReferenciaMultibanco`/`pedirPagamentoMbway`, `lib/eupago.ts`), never Quotagest's — see the "different Eupago entity per channel" note in `lib/eupago.ts` for why (Quotagest's own reference-generation/webhook is known to be unreliable, researched and rejected earlier). Marking the quota paid *in Quotagest* stays a manual step for the association (by design — was an explicit user requirement, not a limitation we're working around) — this feature only makes the *collection* reliable and the confirmation emails automatic.

The shared webhook (`app/api/pagamentos/eupago-callback/route.ts`) tells a quota payment apart from an order by an identifier prefix: `pedirPagamentoQuota` sends Eupago the identifier `quota:{id}` instead of a bare order id, and the webhook branches to `processarCallbackQuota` for anything starting with `quota:` before reaching the existing `orders` lookup — that branch is otherwise untouched. `lib/expiracao.ts`'s `expirarQuotaPendentes()` mirrors `expirarMbwayPendentes()` for the same reason (Eupago doesn't reliably notify on MB WAY expiry).

**If the association already issued a Multibanco reference through Quotagest itself** (e.g. a bulk "quota geral" — surfaced as `socio.referenciaPendente` from `lib/quotagest.ts`), `PagarQuotaForm` shows that reference instead of generating a competing one through our own channel (confusing to have two valid references for the same debt) — only MB WAY stays offered in that case, since Quotagest's bulk issuance doesn't push MB WAY requests. This was a deliberate simplification: the alternative (detecting payment on Quotagest's own reference by diffing live reads over time) was considered and rejected — it would make confirmation emails "eventual" instead of instant, for no real benefit.

### Eventos modal (soft-navigation photo view)

Clicking an event in `EventosTimeline` opens it as a modal overlay instead of a full page navigation, via Next's parallel + intercepting routes: `app/@modal/(.)eventos/[id]/page.tsx` intercepts the `/eventos/[id]` route and renders `components/EventoModal.tsx` (a portal-based overlay) instead of the full page — but a direct link or page refresh still hits the real `app/eventos/[id]/page.tsx` (`EventoPageClient.tsx`), so the URL stays shareable. Both the modal and the full-page fallback render their photo/caption content through the shared `components/EventoConteudo.tsx`. `app/@modal/default.tsx` (required by Next for every parallel-route slot) renders `null` so the slot is empty on any route that isn't intercepted. See the `app/template.tsx` note above for why `EventoModal` needs a `createPortal` — don't reintroduce a `fixed`-positioned element inside the normal `children` tree without accounting for that.

### Legal pages

`/termos`, `/privacidade`, `/cookies` all render through the shared `components/PaginaLegal.tsx` template (background video + text + `ContactosSection` + `Footer`) rather than each having bespoke markup — add new legal-style pages the same way instead of duplicating the layout.

### Desktop/mobile split components

Some sections have separate desktop/mobile implementations rather than one responsive component (e.g. `ObjetivosDesktop.tsx` / `ObjetivosMobile.tsx`, both used by `ObjetivosSection.tsx`). Check for this pattern before assuming a single component handles both breakpoints.

### Admin panel (`/admin`)

Gated by `role: "admin"` (`app/admin/layout.tsx`). Four sections under the sidebar (`components/admin/AdminSidebar.tsx`): Encomendas (orders), Sócios (read/write against the Quotagest API, `lib/quotagest.ts`), Utilizadores (site accounts), and Editar Conteúdo (see below). Each section follows the same shape: a Server Component `page.tsx` under `app/admin/(painel)/<secao>/page.tsx` fetches data and passes it to a `"use client"` `components/admin/<Secao>AdminList.tsx`, which renders search/filter pills + a list of `<details>` cards with inline-edit forms, backed by `"use server"` actions gated by `exigirAdmin()` (`lib/admin-auth.ts`). Destructive/important confirmations go through `components/admin/ConfirmDialog.tsx`'s `useConfirmDialog()` hook (a Radix `AlertDialog`-based modal) instead of native `window.confirm`/`prompt`. `/admin` itself shows "N novos" badges per section (`lib/admin-notificacoes.ts`, tracks last-visited-per-section) and a couple of financial stats pulled from the Quotagest `/quotas` endpoint.

### CMS de conteúdo (`/admin/conteudo`)

No headless CMS (Sanity was evaluated and deliberately dropped, see git history — the site already had Postgres/Drizzle and a working Vercel Blob upload pattern, so a custom admin was less work and more consistent than integrating one). One sidebar entry, with its own sub-navigation (`components/admin/ConteudoSubNav.tsx`) across five areas, each with its own `app/actions/admin-<area>.ts` and `components/admin/<Area>AdminList.tsx`:

- **Fundadores** (`fundador` table) — add/edit/remove, one photo each.
- **Objetivos** (`objetivo_foto` table) — 3 fixed rows (`encontros`/`restauracao`/`workshops`, matching the hardcoded cards in `ObjetivosDesktop.tsx`/`ObjetivosMobile.tsx`), photo-only, no add/remove.
- **Textos** (`conteudo_texto` key-value table + `pagina_legal_seccao`) — homepage/sobre copy is flat key-value (`lib/textos.ts`'s `TEXTOS_PADRAO` is both the seed and the runtime fallback for any key not yet in the DB); the three legal pages (`/termos`, `/privacidade`, `/cookies`) are an ordered, addable/removable list of `{subtitulo, corpo}` sections per page. `components/TextoComLinks.tsx` auto-linkifies emails/URLs in `corpo` on render — admin text fields are always plain text, never raw HTML.
- **Eventos** (`evento`/`evento_foto`) — see "Eventos" above.
- **Produtos** (`produto`/`produto_foto`) — `cores`/`tamanhos` are optional `text[]` columns (`null` when a product has no such variant), edited via a tag-input (`TagsInput` in `ProdutosAdminList.tsx`) behind a "Tem cores?"/"Tem tamanhos?" checkbox — no SKU/per-variant-stock table, checkout only ever tracked availability at the product level (`disponivel`). `lib/produtos.ts`'s `Produto.preco` stays euros (float) even though the DB stores `precoCentimos`, so `CartSheet.tsx`/`CheckoutForm.tsx`/`app/actions/encomendas.ts` didn't need to change.

**Recurring gotcha hit repeatedly while building this**: several public components (`LojaGrid.tsx`, `EventosTimeline.tsx`, `FoundersSection.tsx`, `ObjetivosDesktop/Mobile.tsx`) were `"use client"` and called their `lib/*.ts` data function at module scope (`const produtos = getProdutos();`). Once those functions became `async` DB queries, that pattern breaks two ways: first as a hard runtime crash (`"No database connection string was provided to neon()"`) if the whole `lib/*.ts` file gets pulled into the client bundle, second as a build-time error once the file is marked `import "server-only"` (`"You're importing a module that depends on server-only"`) — hit this exact error on `lib/eventos.ts` mid-migration, caused by `EventosTimeline.tsx` importing the *pure* helpers `mesDe`/`formatarDataCompleta` as values (not types) from the same file as the DB queries. Fixed by moving pure/client-safe helpers into their own file (`lib/eventos-formato.ts`, `lib/preco.ts`) and having the page-level Server Component fetch once and pass data down as props. **Before adding anything to a `lib/*.ts` file that already has `import "server-only"`, check whether it needs to be callable from a client component — if so, it belongs in a separate file.**

Image uploads everywhere in the CMS go through `lib/upload.ts` (`validarFoto`/`carregarFoto`/`apagarFoto`, wrapping `@vercel/blob`'s `put()`/`del()` — the same pattern `app/actions/perfil.ts`'s `atualizarFoto` already used for profile photos). Entities needing an id *before* their first photo upload (Fundadores, Produtos — the Blob path is `{area}/{id}/...`) generate a `randomUUID()` in the server action itself rather than relying on the DB's `defaultRandom()`. Eventos avoids this because its id is a slug derived from the title, known before any upload.

`data/eventos.json`, `data/produtos.json`, `data/fundadores.json` are gone — don't recreate them or add a fallback path that reads them; the CMS above is now the only source for this content. The `public/eventos/`, `public/loja/`, `public/fundadores/` image folders are still there and still referenced (existing DB rows point at their old paths) — don't delete those.

## Regras de comportamento
- **Nunca faças `git commit` (nem `push`) por iniciativa própria — nem depois de terminar uma tarefa, nem "para não perder o trabalho". Só commits quando o utilizador pedir explicitamente essa ação, nessa conversa.**
- Não tentes redimensionar a janela física do browser (é bloqueado por segurança e causa loops inúteis)
- Para testar diferentes tamanhos de ecrã, usa emulação de viewport/dispositivo, não resize de janela
- Evita múltiplos screenshots sucessivos durante ajustes — implementa, depois faz UMA verificação visual final