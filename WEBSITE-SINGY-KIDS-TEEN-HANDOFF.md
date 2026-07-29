# Singy Kids & Singy Teen Public Website — Handoff

## What this is

A new, standalone public marketing site for UAOS, showing only **Singy Kids** and **Singy Teen**. All other UAOS products are hidden behind a single generic "more products are coming later" message (AR/EN/DE). Built fresh per the approved written design spec (light glassmorphism, blue→violet gradient wave, glass-orb Singy mark) — no prior design artifact existed in this repo to reuse.

## Where it lives

`public-website/` at the repo root — a new, isolated Vite + React 19 single-page app. It does **not** touch `frontend/` (the internal keyboard/MIDI arranger app) or `uaos-live-clean/` (the internal owner-only "Real Workstation" dashboard, which has `PUBLIC LAUNCH: BLOCKED` hardcoded into its own safety flags). See the "Why a new folder" section below for how this was determined.

## Why a new folder (important context for the owner)

The task briefing assumed a Vercel project named `frontend` was already the public site showing "Coming Soon." Investigation found:

- The Vercel project really is named `frontend` (`prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI`), confirmed via the Vercel API — this part of the briefing was correct.
- But its current live production content (the "Coming Soon" page at `aeplatform.app`) was deployed **directly via the Vercel CLI** (`source: cli`, actor `cursor-cli`), not through this git repository. That exact HTML does not exist anywhere in this repo or its history.
- The `frontend/` folder in this repo is unrelated internal app code (MIDI/keyboard arranger), and `uaos-live-clean/` (the repo's actual git-connected Vercel deploy target) is an internal owner dashboard, not a marketing site.

So there was no existing public-website source to "complete." `public-website/` was built new, but scoped narrowly (one page, no business logic, no internal-app code reuse needed) rather than as a from-scratch UAOS rebuild.

## Structure

- `src/i18n/` — `LanguageContext.jsx` (React context: language state, `localStorage` persistence, browser-language detection with `en` fallback, reactive `<html lang/dir>` + meta-tag updates) and one strings file per language (`strings.ar.js`, `strings.en.js`, `strings.de.js`). No hardcoded UI text exists outside these files.
- `src/components/` — `NavBar`, `Hero`, `SingyMark` (original SVG mark, not stock art), `WaveBackground` (animated SVG, respects `prefers-reduced-motion`), `ProductSection` (reused for both Kids and Teen via a `data` prop), `ComparisonSection`, `ComingLaterSection`, `Footer`, `LanguageSwitcher`.
- `src/styles/` — `tokens.css` (design tokens: light/lavender palette, gradients, glass surfaces, spacing, incl. a `prefers-color-scheme: dark` fallback), `base.css` (reset, skip link, reduced-motion, focus ring), `components.css` (all component styling).
- `public/legal/impressum.html`, `public/legal/datenschutz.html` — static, trilingual placeholder pages stating legal data is pending owner input (see `WEBSITE_LEGAL_DATA_REQUIRED.md`). No `Kontakt` link exists yet since no real contact channel was found anywhere in the repo.

## What's intentionally NOT here

No other UAOS product names, logos, or links. No pricing, checkout, login, database, or newsletter. No analytics/tracking scripts. No unproven marketing claims ("#1", "best AI," "available now"). `robots: noindex, nofollow` is set site-wide until legal data is complete and the owner approves a production launch.

## How to run it locally

```bash
cd public-website
npm install
npm run dev       # http://127.0.0.1:5190
npm run build     # outputs to public-website/dist
npm run preview   # serves the production build at http://127.0.0.1:4190
```

## Next safe action

Review this local candidate, supply the fields listed in `WEBSITE_LEGAL_DATA_REQUIRED.md`, and confirm whether `public-website/` should be connected to the `frontend` Vercel project for a future deploy. No push, PR, or deploy has been performed.
