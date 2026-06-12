# UAOS Desktop Runbook

## Local Web Build

Run:

```powershell
npm run setup
npm run build
```

## Desktop Smoke Check

Run:

```powershell
npm run desktop:smoke
```

The smoke check verifies that the built web entry and Electron files exist and that the desktop entry does not fall back to Vercel or enable renderer `nodeIntegration`.

## Desktop Development

Run the Vite dev server, then start desktop:

```powershell
npm run dev --prefix uaos-live-clean
npm run desktop
```

If `uaos-live-clean/dist/index.html` exists, desktop loads the built app. Otherwise it falls back to `http://127.0.0.1:5173`.

## Packaging

Installer signing and final distribution are intentionally not automated in V1. Manual packaging can be prepared later with the existing desktop package scripts after signing and release settings are confirmed.

