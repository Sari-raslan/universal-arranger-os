# Build / Lint / Typecheck / Test Evidence

Project: `public-website/` (new, isolated Vite + React app; package manager: npm, matching the rest of this repo).

## npm ci / npm install

`public-website/package.json` had no lockfile at creation time, so `npm install` was used (generates `package-lock.json`). Result: 19 packages installed, 0 vulnerabilities. Re-running `npm ci` will work from the generated lockfile going forward.

## npm run build — PASS

See `build-output.txt` in this same folder for the raw output. Summary:

```
dist/index.html                   1.24 kB
dist/assets/index-*.css           8.35 kB (gzip 2.40 kB)
dist/assets/index-*.js          205.01 kB (gzip 64.99 kB)
✓ built in <100ms
```

## npm run lint — NOT CONFIGURED

No `lint` script exists in `public-website/package.json`. This is a new, minimal project; no ESLint config was carried over from `frontend/` or `uaos-live-clean` since those are unrelated apps with their own (also absent) lint setups. Not invented per instructions — logged here as missing rather than fabricated.

## npm run typecheck — NOT CONFIGURED

Plain JSX, no TypeScript. No `typecheck` script exists. Logged as missing, not invented.

## npm test — NOT CONFIGURED

No test runner is wired up for this new site (a 1-page marketing site with no business logic beyond i18n string lookup and a horizontal-scroll-safe CSS layout, both verified manually — see `responsive-rtl-qa-report.md`). No `test` script exists. Logged as missing, not invented.

## git diff --check / git diff --stat

New files only (untracked), so there is no diff to check on this branch relative to its parent for whitespace errors; `git status --short` output is recorded in `files-changed.md` in this folder.
