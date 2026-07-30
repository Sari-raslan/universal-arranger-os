# Image Rendering Defect — Root Cause Analysis

## Symptom

`assets/singy-identity-strip.webp` failed to render in all 6 previous screenshot captures (desktop + mobile, AR/EN/DE); `assets/concept-mosaic.webp` additionally failed on mobile only. Both left visible blank white gaps in the page where the images should appear.

## Investigation

Both assets were confirmed **not corrupted** before any code change:
- Direct HTTP fetch of both files: `200 OK`, correct `image/webp` MIME type, valid WebP binary (`RIFF....WEBP` signature confirmed).
- `serve.mjs` (the local static server) correctly maps `.webp` → `image/webp`.
- No CSS in `style.css` sets `display:none`, `opacity:0`, or `visibility:hidden` on `.identity-strip` or `.vision-mosaic`; no `object-fit`/`overflow` clipping the image to zero size.
- No JavaScript in `main.js` swaps `src`/class on these images after initial render, and no CSP header blocks image loading.

Both `<img>` tags in `main.js` used `loading="lazy"` with correct `width`/`height` attributes but no `decoding` attribute:

```html
<img src="./assets/concept-mosaic.webp" ... width="1800" height="1000" loading="lazy" />
<img src="./assets/singy-identity-strip.webp" ... width="1600" height="430" loading="lazy" />
```

### Diagnostic protocol (exact 3-case test, run against the local build before any fix)

| Case | identity-strip | concept-mosaic |
|---|---|---|
| A: no scroll, wait 5s | `complete:false, naturalWidth:0` | `complete:true, naturalWidth:1800` (desktop viewport) |
| B: scrollIntoView, wait 2s | `complete:true, naturalWidth:1600` | `complete:true, naturalWidth:1800` |
| C: explicit `image.decode()` | resolves OK, `naturalWidth:1600` | resolves OK, `naturalWidth:1800` |

Network log during this test: both assets `200 OK`, `content-type: image/webp`. Zero console errors, zero `requestfailed` events throughout.

**Conclusion:** native browser `loading="lazy"` (backed by `IntersectionObserver`) never fires for these images unless the page is physically scrolled near them. The full-page screenshot mechanism used for QA (Chromium/CDP `captureBeyondViewport`) does not physically scroll the page before capturing — it renders content beyond the viewport directly — so lazy images that were never scrolled into an actual viewport never trigger their load. `concept-mosaic` "worked" on desktop only because the desktop viewport (1440×900) happens to place it within the browser's native lazy-load pre-fetch distance from the top of a shorter page; on the much taller mobile single-column layout, it fell outside that distance too. This is a real, reproducible defect (a real visitor scrolling manually never sees it — but a certain class of automated captures/crawlers, and potentially browsers with narrower lazy-load margins or slow connections, could).

## Second finding during verification: paint/composite timing

After removing `loading="lazy"`, an initial re-test with only a ~400ms wait between page load and screenshot still showed both images `complete:true, naturalWidth>0` in the DOM, yet the **screenshot pixels** still showed blank containers. This is a distinct issue: the resource had decoded (confirmed by JS state) but the compositor had not yet painted it into the frame being captured. Explicitly waiting for `image.decode()` to resolve for every image, plus two `requestAnimationFrame` ticks, plus an additional ~1.5s settle time before screenshotting resolved this reliably across all 6 required combinations. This is a property of the verification harness, not a further site defect — real browsers paint newly-decoded large images within a frame or two under normal use; the gap only shows up when a screenshot is taken at the earliest possible instant after `networkidle`.

## Fix applied (smallest possible change)

```diff
- <img src="./assets/concept-mosaic.webp" ... loading="lazy" />
+ <img src="./assets/concept-mosaic.webp" ... loading="eager" decoding="async" />

- <img src="./assets/singy-identity-strip.webp" ... loading="lazy" />
+ <img src="./assets/singy-identity-strip.webp" ... loading="eager" decoding="async" />
```

Only these two `<img>` tags in `public-website/main.js` were changed. `width`/`height` attributes were already correct and unchanged. No other image on the page was touched — the hero image keeps its `fetchpriority="high"`, and all other lazy images (`singy-kids.webp`, `singy-teen.webp`) remain `loading="lazy"` as intended, since those are correctly positioned/sized and were never reported broken. No re-encoding of the WebP files was needed or performed — `image.decode()` succeeded cleanly for both from the start, proving the files themselves were never corrupted.

## Verification after fix

Re-ran the identical 3-case diagnostic against the rebuilt local site: **Case A (no scroll, wait 5s) now shows both images `complete:true` with correct `naturalWidth`/`naturalHeight`** — the exact case that failed before. Full 6-combination screenshot verification (local, then live) confirms both images visibly render in every required language/device combination, including the previous worst case (German/mobile).
