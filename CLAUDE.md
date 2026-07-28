# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About

Official site for "Fumarentas do Asfalto" (a motorcycle association), replacing a previous Wix site. Content and copy are in Portuguese (pt).

## Before writing Next.js code

This project pins `next@16.2.6`, a version newer than most training data. **Read `node_modules/next/dist/docs/` before using any Next.js API you're not 100% sure about** — App Router conventions, config options, and data-fetching APIs may differ from what you expect. `app/template.tsx` in this repo (used purely for a fade-in page transition via `tw-animate-css` utility classes) is an example of a file whose purpose isn't obvious without knowing current App Router special-file conventions.

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
- Deploy: Vercel, `main` branch is production, `test` branch is staging

## Architecture

### Persistent Google Map instance

`components/Map.tsx` keeps its `google.maps.Map` instance in a **module-level variable** (`mapInstance`, outside the component), not in React state. `app/layout.tsx` renders one `<Map />` inside a hidden, fixed, off-screen div so the map initializes once at the root and survives client-side navigation. Any page that wants to show the map (currently `ContactosSection`) must re-parent the *existing* `mapDiv` into its own ref rather than creating a new map — see the `if (mapInstance)` branch in `Map.tsx`. If you need a second, independent map instance somewhere, this singleton pattern will fight you; plan around it explicitly.

### Homepage scroll-snap

`app/page.tsx` wraps `HeroSection`, `ObjetivosSection`, and `ContactosSection` in a `#snap-container` (`snap-y snap-mandatory`, `h-dvh`, `overflow-y-scroll`). `ScrollIndicator` is a reusable arrow component that scrolls to the next section, but has to temporarily override `scrollSnapType` to animate smoothly past the snap points — see how it's used in `HeroSection`/`ObjetivosSection` before changing snap behavior. Other pages (`/sobre`, `/eventos`, legal pages) are normal (non-snap) scroll pages.

### Eventos (events timeline)

- Data lives in `data/eventos.json` — flat array of event objects (`id`, `titulo`, `local`, `data`, `descricao`, `destaque`, `pasta`, `capa`, `fotos`). Photos live in `public/eventos/{pasta}/`, referenced by filename in `fotos`.
- `destaque: true` marks milestone events (foundation, anniversaries) that render larger in the timeline.
- `components/EventosTimeline.tsx` renders a horizontal timeline grouped by year, with custom auto-scroll near the viewport edges, polaroid-style alternating card rotation, and an on-hover auto-advancing photo carousel. A fixed year indicator updates based on scroll position.
- Known layout limitation (see README): the hover-expanded card pushes layout down slightly; a full fix would need a React Portal and hasn't been done.

### Legal pages

`/termos`, `/privacidade`, `/cookies` all render through the shared `components/PaginaLegal.tsx` template (background video + text + `ContactosSection` + `Footer`) rather than each having bespoke markup — add new legal-style pages the same way instead of duplicating the layout.

### Desktop/mobile split components

Some sections have separate desktop/mobile implementations rather than one responsive component (e.g. `ObjetivosDesktop.tsx` / `ObjetivosMobile.tsx`, both used by `ObjetivosSection.tsx`). Check for this pattern before assuming a single component handles both breakpoints.

## Not yet implemented
Per the README backlog: loja (store/cart/checkout/payment), login (Google/Facebook/email), user profiles, Facebook Graph API event sync (evaluated, blocked on Meta App Review complexity), **Sanity as the headless CMS backoffice for managing products/events/founders**. Auth.js and a payment provider (Eupago/IfThenPay) have been researched but nothing is wired up — don't assume auth or payment infrastructure exists.

## Content strategy
Content that will eventually be managed via Sanity (events, founders, products) should be structured with that migration in mind: keep data shape simple and flat (e.g. arrays of objects with clear field names), separate from component logic, so swapping a static array for a Sanity fetch later is a small change, not a rewrite.

## Regras de comportamento
- Não tentes redimensionar a janela física do browser (é bloqueado por segurança e causa loops inúteis)
- Para testar diferentes tamanhos de ecrã, usa emulação de viewport/dispositivo, não resize de janela
- Evita múltiplos screenshots sucessivos durante ajustes — implementa, depois faz UMA verificação visual final