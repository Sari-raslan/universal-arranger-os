# GitHub Required Status Checks

Planned checks:
- `npm run ai:factory:check`: all AI Factory safety files remain present and safe.
- `npm run ai:factory:cost`: task queue and budget guard pass.
- `npm run ai:factory:github-plan`: GitHub protection plan remains local and inactive.
- `npm test --if-present`: tests where available.
- `npm run build --prefix uaos-live-clean`: only when UI/build-sensitive changes happen.

Future checks:
- Playwright smoke checks for UI workflows.
- Vercel preview check after preview-only integration is approved.

