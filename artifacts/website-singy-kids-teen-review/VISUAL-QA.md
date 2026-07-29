# Visual QA — Singy Kids & Singy Teen Public Website

Method: real headless-Chromium screenshots (Playwright, one-off local QA tool, not part of the shipped site) of the production build served via `vite preview` at `http://127.0.0.1:4191`, full-page capture, at the 6 required language × device combinations. Screenshots live in `artifacts/website-singy-kids-teen-review/screenshots/`. Automated capture also recorded zero browser console errors and confirmed no "lorem ipsum" text on every page; each screenshot was then visually reviewed image-by-image below.

## 01-ar-desktop.png (Arabic, 1440×900)

- Hero: fully visible — title, subtitle, both CTA buttons, glass orb with Singy note mark. **PASS**
- Singy identity: glass-orb mark, gradient wave background, glassmorphism cards all present and on-brand. **PASS**
- Glass orb / note mark: not clipped, centered, full circle visible. **PASS**
- Singy Kids / Singy Teen: both clearly titled and legible in Arabic. **PASS**
- Other products: none visible; footer/nav only reference Singy Kids, Singy Teen, "قريبًا" (coming later). **PASS**
- RTL: nav mirrors correctly (brand on the right, language switcher on the left), body text right-aligned, bullet markers on the correct side, hero text/CTAs flow right-to-left. **PASS**
- No horizontal scroll (capture width = 1440px, matches viewport). **PASS**
- Buttons: no overlap, adequate spacing. **PASS**
- No placeholder/Lorem Ipsum text. **PASS**
- No dev tools, no error banners, no broken images. **PASS**

## 02-ar-mobile.png (Arabic, 390×844)

- Hero fully visible, stacks vertically above the glass orb, nothing cropped. **PASS**
- Singy identity intact at mobile size, orb legible. **PASS**
- Glass orb / note mark not clipped. **PASS**
- Singy Kids / Singy Teen sections stack cleanly, cards full-width, text legible. **PASS**
- No other products referenced. **PASS**
- RTL preserved at mobile width (nav order, text alignment, bullets). **PASS**
- No horizontal scroll. **PASS**
- CTA buttons stack vertically, no overlap, no overflow past viewport edge. **PASS**
- No placeholder text. **PASS**
- No dev tools / error messages. **PASS**

## 03-en-desktop.png (English, 1440×900)

- Hero fully visible with English copy ("A smart musical experience for a new generation"), both CTAs present. **PASS**
- Singy identity consistent with the Arabic version (same visual system). **PASS**
- Glass orb / note mark not clipped. **PASS**
- Singy Kids / Singy Teen sections render with correct English copy and status pill "Preparing for launch". **PASS**
- No other UAOS product names/links anywhere. **PASS**
- LTR layout correct (nav left-to-right: brand, links, language switcher on the right). **PASS**
- No horizontal scroll. **PASS**
- No button overlap. **PASS**
- No Lorem Ipsum / placeholder copy. **PASS**
- No dev tools / error messages. **PASS**

## 04-en-mobile.png (English, 390×844)

- Hero fully visible, no cropping. **PASS**
- Singy identity intact. **PASS**
- Glass orb / note mark not clipped. **PASS**
- Kids/Teen sections stack correctly, legible. **PASS**
- No other products shown. **PASS**
- LTR preserved. **PASS**
- Nav wraps to multiple lines at this width (Home/Singy Kids/Singy Teen, then Coming Later, then the language switcher) — this is a deliberate flex-wrap, not a bug: no links overlap, nothing is cut off, and no horizontal scroll results. **PASS** (noted as acceptable wrap behavior, not a defect)
- No horizontal scroll. **PASS**
- No button overlap. **PASS**
- No placeholder text, no dev tools/errors. **PASS**

## 05-de-desktop.png (German, 1440×900)

- Hero fully visible with the longest of the three hero titles ("Ein intelligentes Musikerlebnis für eine neue Generation") — wraps to two lines cleanly, no overflow past the content column. **PASS**
- Singy identity consistent. **PASS**
- Glass orb / note mark not clipped. **PASS**
- Kids/Teen sections render full German copy including the longer status pill "Wird für den Start vorbereitet" without overflowing its pill shape. **PASS**
- No other products shown. **PASS**
- LTR layout correct. **PASS**
- No horizontal scroll. **PASS**
- CTA buttons ("Singy Kids entdecken" / "Singy Teen entdecken" — the longest button labels of the three languages) fit fully within their container with no overlap or clipping. **PASS**
- No placeholder text, no dev tools/errors. **PASS**

## 06-de-mobile.png (German, 390×844)

- Hero fully visible at the narrowest required width with the longest-language copy — this is the single highest-risk combination in the whole matrix, and it passes cleanly. **PASS**
- Singy identity intact. **PASS**
- Glass orb / note mark not clipped. **PASS**
- Kids/Teen sections stack correctly; longest bullet lines wrap without overflowing their card. **PASS**
- No other products shown. **PASS**
- LTR preserved. **PASS**
- No horizontal scroll (capture width = 390px, matches viewport exactly). **PASS**
- Buttons stack vertically, full text visible, no clipping, no overlap. **PASS**
- No placeholder text, no dev tools/errors. **PASS**

## Overall result

**6/6 screenshots PASS all checklist items.** No defects found. The highest-risk combination (German/mobile, longest strings at narrowest width) was specifically inspected and holds up.
