# Files Changed / Added

All items below are **new, untracked** files on branch `website/singy-kids-teen-launch-prep`. Nothing in `frontend/`, `uaos-live-clean/`, or any other existing folder was modified.

## New app: `public-website/`

```
public-website/.gitignore
public-website/index.html
public-website/package.json
public-website/package-lock.json
public-website/vite.config.js
public-website/src/main.jsx
public-website/src/App.jsx
public-website/src/i18n/LanguageContext.jsx
public-website/src/i18n/strings.ar.js
public-website/src/i18n/strings.de.js
public-website/src/i18n/strings.en.js
public-website/src/components/NavBar.jsx
public-website/src/components/Hero.jsx
public-website/src/components/SingyMark.jsx
public-website/src/components/WaveBackground.jsx
public-website/src/components/LanguageSwitcher.jsx
public-website/src/components/ProductSection.jsx
public-website/src/components/ComparisonSection.jsx
public-website/src/components/ComingLaterSection.jsx
public-website/src/components/Footer.jsx
public-website/src/styles/tokens.css
public-website/src/styles/base.css
public-website/src/styles/components.css
public-website/public/favicon.svg
public-website/public/og-image.svg
public-website/public/manifest.json
public-website/public/legal/impressum.html
public-website/public/legal/datenschutz.html
```

(`public-website/node_modules/` and `public-website/dist/` are build artifacts, not source, and are excluded from this list.)

## New root-level deliverables

```
WEBSITE_LEGAL_DATA_REQUIRED.md
WEBSITE-SINGY-KIDS-TEEN-HANDOFF.md
WEBSITE-SINGY-KIDS-TEEN-VERIFICATION.md
WEBSITE_DEPLOYMENT_READINESS.json
artifacts/website-singy-kids-teen-review/responsive-rtl-qa-report.md
artifacts/website-singy-kids-teen-review/build-lint-typecheck-test-evidence.md
artifacts/website-singy-kids-teen-review/files-changed.md
artifacts/website-singy-kids-teen-review/build-output.txt
artifacts/website-singy-kids-teen-review/VISUAL-QA.md
artifacts/website-singy-kids-teen-review/screenshots/01-ar-desktop.png
artifacts/website-singy-kids-teen-review/screenshots/02-ar-mobile.png
artifacts/website-singy-kids-teen-review/screenshots/03-en-desktop.png
artifacts/website-singy-kids-teen-review/screenshots/04-en-mobile.png
artifacts/website-singy-kids-teen-review/screenshots/05-de-desktop.png
artifacts/website-singy-kids-teen-review/screenshots/06-de-mobile.png
```

Screenshots were captured with a one-off local Playwright script run from the OS temp scratchpad directory (not added to this repo — it was a throwaway QA tool, not part of the site). The in-app Browser pane and Claude-in-Chrome were tried first and were unavailable in this session (see `VISUAL-QA.md` / final report for detail).

## Pre-existing, unrelated uncommitted changes

The working tree already contained ~540 uncommitted changes across `uaos-agent-factory/` and `uaos-ai-factory/` before this task started (unrelated infrastructure work from a prior session). Those files were not touched, viewed for editing, or included in anything above.
