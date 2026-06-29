# Demo Gateway Link Validation Checklist

Status: DONE_LOCAL_ONLY

Mode: LOCAL / STATIC ONLY

## Private / Static Gateway Files Reviewed

- `deploy/aeplatform-private-demo-gateway/README_FIRST.md` - read-only reference.
- `deploy/aeplatform-private-demo-gateway/index.html` - root/private fallback page.
- `deploy/aeplatform-private-demo-gateway/robots.txt` - blocks crawlers with `Disallow: /`.
- `deploy/aeplatform-private-demo-gateway/vercel.json` - read-only config reference.
- `deploy/aeplatform-private-demo-gateway/vercel.broken.backup.json` - read-only backup/reference.
- `deploy/aeplatform-private-demo-gateway/jc-aeplatform-2026-private-jc-7k4p9x/index.html` - Jobcenter private page.
- `deploy/aeplatform-private-demo-gateway/sp-aeplatform-2026-private-sp-3m8q2v/index.html` - supporter private page.

No gateway file was modified.

## Intended Audience

- Jobcenter: private project/funding review context.
- Supporter/friend: private explanation and support context.

## Link Categories

- Root/private fallback: `index.html`.
- Jobcenter private page: `jc-aeplatform-2026-private-jc-7k4p9x/index.html`.
- Supporter private page: `sp-aeplatform-2026-private-sp-3m8q2v/index.html`.
- Robots/crawler safety: `robots.txt`.
- Header/config safety reference: `vercel.json`.
- Backup rewrite reference: `vercel.broken.backup.json`.

## Local / Static-Only Safety Label

Use this label for screenshots and notes:

`LOCAL / STATIC ONLY - NOT PUBLIC RELEASE`

Add this note when sharing screenshots:

`Private demo gateway reference for Jobcenter/supporter explanation only. No deploy, no Vercel execution, no public release, no payment, and no real keyboard writer/export are active.`

## Execution Safety

- No Vercel executed.
- No deploy executed.
- No public URL created.
- No public release claim.
- No payment claim.
- No production service claim.
- No real keyboard writer/export claim.
- No app source changed.
- No frontend source changed.

## Screenshot Readiness Notes

Ready for local/private screenshots when:

- The screenshot clearly shows private/local presentation context.
- The owner explains that direct links are not real authentication.
- Jobcenter screenshots include the transparent limitation notes.
- Supporter screenshots include private support framing.
- Any URL shown is treated as private/static reference only.
- The screenshot does not imply a live public service.

## Broken / Missing Links Found

- Local static page files for root, Jobcenter, and supporter were present.
- `vercel.json` currently contains headers and no rewrite entries.
- `vercel.broken.backup.json` contains historical private path rewrites and is reference-only.
- No missing local static files were found in the known gateway folder.
- No external link availability was tested.

## Next Safe Owner Action

Use the Jobcenter/supporter pages only for local/private screenshots and explanation. If the owner later wants live private hosting or password protection, plan that as a separate owner-approved local planning task; do not execute hosting or deployment from this validation.
