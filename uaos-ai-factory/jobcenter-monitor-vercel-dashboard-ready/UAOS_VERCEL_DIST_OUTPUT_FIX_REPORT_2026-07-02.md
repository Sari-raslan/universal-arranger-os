# UAOS Vercel Dist Output Fix Report - 2026-07-02

## Ziel
Vercel Build von `public` Output auf erzeugten `dist` Output umstellen.

## Target repo
https://github.com/aeplatform-app/uaos-jobcenter-monitor.git

## Linked repo commit
`a2ef16f`

## Ergebnis
- `build-static.js` created: YES
- Vercel `outputDirectory`: `dist`
- Vercel `buildCommand`: `node build-static.js`
- Local build created `dist`: YES
- Push to `main`: YES

## Lokaler Build
- `dist/index.html`: YES
- `dist/jobcenter/index.html`: YES
- `dist/status/index.html`: YES
- `dist/data/project-status.json`: YES
- `dist/data/files-index.json`: YES
- `dist/data/changelog.json`: YES

## Validierung
- `vercel.json` valid: YES
- `package.json` valid: YES
- `project-status.json` valid: YES
- `files-index.json` valid: YES
- `changelog.json` valid: YES
- Safety scan: PASS

## Public URL test
- `https://uaos-jobcenter-monitor.vercel.app/jobcenter/`: HTTP 200
- `https://uaos-jobcenter-monitor.vercel.app/status/`: HTTP 200
- Content updated: NO
- Missing public content markers:
  - `4.700 EUR`
  - `Ertragserwartung`
  - `Kundengewinnung`
  - `Kostenbasis`
  - `Dateien`
  - `abgeschlossen`
  - `in Entwicklung`
  - `geplant`
  - `Changelog`
  - `Letzte Aktualisierung`

## Safety
- App.jsx touched: NO
- Payment changes: NO
- Keyboard output changes: NO
- Businessplan/PPTX changes: NO
- Vercel CLI used: NO
- Vercel token used: NO
- Force push used: NO

## Final status
PUSH PASS - manual Vercel redeploy required, Cache OFF.
