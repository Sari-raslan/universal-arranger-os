# QA Required Commands Plan

Future AI PRs should normally run:
- `npm run ai:factory:check`
- `npm run ai:factory:cost`
- relevant `npm run ai:factory:*plan` check
- `npm test --if-present` when tests are relevant

For UI/build-sensitive changes only:
- `npm run build --prefix uaos-live-clean`

Build remains a future controlled check, not automatic for every planning task.

