# Singy Kids & Singy Teen Public Website — Verification

## Build

`npm run build` — **PASS**. Output: `dist/index.html` (1.24 kB), CSS bundle 8.35 kB gzip 2.40 kB, JS bundle 205.01 kB gzip 64.99 kB. Full output in `artifacts/website-singy-kids-teen-review/build-output.txt`.

## Lint / Typecheck / Test

Not configured in this new project — no scripts to run, nothing invented. Details: `artifacts/website-singy-kids-teen-review/build-lint-typecheck-test-evidence.md`.

## Responsive QA

Verified at all 5 required breakpoints (1440×900, 1280×720, 768×1024, 390×844, 360×800): **no horizontal scroll at any combination**, checked across English, German (longest strings, checked at the narrowest width as the highest-risk case), and Arabic. Full detail: `artifacts/website-singy-kids-teen-review/responsive-rtl-qa-report.md`.

## Visual QA (real screenshots)

6/6 required screenshots (AR/EN/DE × Desktop 1440×900 / Mobile 390×844) captured as real PNGs and reviewed image-by-image — **all PASS**. The in-app Browser pane could not composite frames in this session, and no Claude-in-Chrome browser was connected, so a one-off local Playwright headless-Chromium script (not part of the shipped site) was used to render the actual production build and capture full-page PNGs. Full per-image findings: `artifacts/website-singy-kids-teen-review/VISUAL-QA.md`. Screenshots: `artifacts/website-singy-kids-teen-review/screenshots/`.

## RTL / LTR

Arabic renders `dir="rtl"`/`lang="ar"`; English and German render `dir="ltr"`. Verified live in the DOM after each language switch, at every breakpoint. Language switch is instant (no page reload) and persists via `localStorage`. Initial-load browser-language detection confirmed working (defaulted to Arabic in this test environment, matching its browser locale, with `en` as the documented fallback).

## Accessibility

Semantic landmarks (`header`, `nav[aria-label]`, `main`, `footer`), skip-to-content link, one `<h1>` + four `<h2>`s, all 4 SVG marks have translated `aria-label`s, language-switcher buttons expose `aria-pressed`, global `:focus-visible` ring, `prefers-reduced-motion` respected for both the CSS transitions and the wave animation.

## SEO

Per-language `<title>` and meta description/OG/Twitter tags update reactively with the language switch. `robots: noindex, nofollow` is set site-wide — intentional, since legal data is incomplete and this is a local candidate, not an approved production launch.

## Links

All in-page nav anchors resolve. Footer legal links load correctly from the built output. No links, names, or images for any other UAOS product appear anywhere on the page in any language.

## Content rules

Verified by full-page text extraction in all three languages: only "Singy Kids," "Singy Teen," and the generic "more products are coming later" message appear — no other product names, no pricing, no claims of the form "#1," "best," or "available now."

## Legal data

Incomplete — see `WEBSITE_LEGAL_DATA_REQUIRED.md`. Impressum/Datenschutz pages show an honest pending notice in all three languages rather than fabricated data. This blocks declaring the site production-ready.

## Deploy

No `git push`, no PR, no Vercel deploy performed. Local build verified only.
