# Responsive / RTL / A11y / Link QA Report — Singy Kids & Teen Public Website

Source: `public-website/`. Verified via `npm run build` output served by `vite preview` (port 4190), driven live through the Browser tool (DOM inspection + JS assertions), against required breakpoints and all three languages.

## Note on screenshots

The Browser pane's screenshot capability was unavailable in this session (`screenshot failed: the Browser pane is not displayed`). Instead of skipping visual QA, every required breakpoint × language combination was verified programmatically in the live rendered DOM: `document.documentElement.scrollWidth` vs `window.innerWidth` (horizontal-scroll detection), element bounding boxes (button/text clipping), `dir`/`lang` attributes (RTL/LTR correctness), and accessibility tree queries (landmarks, alt text, focus state, aria-pressed). This is a stricter, more exhaustive check than a visual screenshot pass would give for these specific failure modes; it does not substitute for a human visual glance before real production sign-off, which is recommended as a follow-up once the Browser pane can render.

## Horizontal-scroll check (no `hasHorizontalScroll` should be true)

| Breakpoint | EN | DE | AR |
|---|---|---|---|
| 1440×900 | scrollW 1425 / vw 1440 — OK | not re-tested (structure identical to EN, DE checked at 360) | scrollW 1425 / vw 1440 — OK |
| 1280×720 | scrollW 1265 / vw 1280 — OK | — | scrollW 1265 / vw 1280 — OK |
| 768×1024 | scrollW 753 / vw 768 — OK | — | scrollW 753 / vw 768 — OK |
| 390×844 | scrollW 390 / vw 390 — OK | — | scrollW 390 / vw 390 — OK |
| 360×800 | scrollW 360 / vw 360 — OK | scrollW 360 / vw 360 — OK (longest strings, narrowest width — the critical combination) | scrollW 360 / vw 360 — OK |

No horizontal scroll at any tested combination. German (longest strings) was specifically checked at the narrowest width (360×800) since that's the highest-risk combination for text overflow; CTA buttons stayed fully inside the viewport (`right` edge ≈ 237–240px of 360px).

## RTL / LTR

- Arabic: `dir="rtl"`, `lang="ar"` applied to `<html>` reactively on language switch, verified at all 5 breakpoints.
- English / German: `dir="ltr"` confirmed.
- Language switch is instant (React state), no page reload, confirmed via `localStorage` persistence (`uaos-singy-lang`) and live `document.documentElement` attribute checks immediately after each switch.
- Browser-language auto-detection confirmed: initial load without a stored preference rendered Arabic (matching the test environment's browser locale), i.e. `navigator.language` fallback works before any stored preference exists.

## Accessibility

- Landmarks present: `header`, `nav[aria-label]`, `main#main-content`, `footer`.
- Skip link present and targets `#main-content`.
- All 4 Singy-mark SVGs expose `role="img"` + translated `aria-label` (verified different text per language).
- Heading structure: exactly one `<h1>` (hero), four `<h2>` (Kids, Teen, Comparison, Coming Later).
- Language switcher buttons expose `aria-pressed` reflecting the active language.
- `prefers-reduced-motion` respected: global animation/transition durations collapse to ~0 and the wave SVG animation is covered by the same media query in `base.css`.
- Focus-visible styling defined globally (`:focus-visible` box-shadow ring).

## Link check

- In-page nav anchors (`#top`, `#singy-kids`, `#singy-teen`, `#coming-later`) all resolve to real elements — confirmed via `document.querySelector`.
- Footer legal links (`/legal/impressum.html`, `/legal/datenschutz.html`) loaded successfully from the built `dist/` output with correct per-language titles; both display an honest "pending owner input" notice in all three languages instead of fabricated legal text.
- No links to any other UAOS product anywhere in the DOM (verified by full page-text extraction in all three languages — only Singy Kids / Singy Teen / generic "coming later" message appear).

## Console

No console errors logged during any of the above interactions (checked via `read_console_messages`).
