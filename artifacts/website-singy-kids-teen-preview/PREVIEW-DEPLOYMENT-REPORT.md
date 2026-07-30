# Vercel Preview Deployment Report — Singy Kids & Singy Teen

## What was done

1. Restored and confirmed state: branch `website/singy-kids-teen-launch-prep`, HEAD `08a3d9c3` (matches the expected commit exactly), working tree scoped-clean.
2. Rebuilt `public-website/` locally: `npm run build` — **PASS** (see `build-output.txt`).
3. Verified Vercel project identity via the Vercel MCP integration (**not** the CLI — see incident note below): `get_project(prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI)` returned `name: "frontend"`, and its `domains` list includes `aeplatform.app`, `www.aeplatform.app`, `uaos.app`, `www.uaos.app` — explicitly confirming this is the correct target project before any deploy action.
4. Created **one Preview deployment** via `deploy_to_vercel` with `target: "preview"` (never `"production"`), source files taken directly from the current working tree of `public-website/` (matching commit `08a3d9c3`). Result: deployment `dpl_FAifrt1vvCwCSHLfTpdhD7ugaYuV`, state `READY`, `target: null` (i.e. not production).
5. Verified HTTP behavior of the deployment (200s, correct assets, `noindex`) — see `http-verification.txt`.
6. Attempted to capture real screenshots and console logs of the live deployment URL — **could not complete this in the current session** (see "Screenshot gap" below). Did **not** fabricate or substitute placeholder images.

## Local CLI note

`vercel whoami` was tried first as instructed ("اعرض هوية حساب Vercel الحالية"), but the local Vercel CLI has no stored credentials and started an interactive OAuth device-flow prompt that cannot complete without a human visiting a URL. It was stopped rather than left hanging. Project/account identity was instead verified through the already-authenticated Vercel MCP integration (the same one used successfully in the prior phase of this task to read the live production deployment), which is a legitimate read/deploy path for this Vercel account and does not require the interactive CLI login.

## INCIDENT: unintended alias reassignment

**Severity: moderate. Primary custom domain unaffected; one secondary auto-generated alias affected.**

Creating the preview deployment caused Vercel to automatically reassign the hostname `frontend-aeplatform-app-aeplatform-apps-projects.vercel.app` — previously one of two aliases attached to the current **production** deployment (`dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf`) — to the new preview deployment instead. This was **not** the result of any `vercel alias`, `vercel promote`, or `vercel --prod` command; none of those were run. It is an automatic side effect of the Vercel deploy API assigning a project-level "canonical" alias when a deployment is created outside of a git-branch context (this deployment had no git repo/branch attached — it was a direct file-tree deploy).

**Verified facts (fetched directly, not inferred):**

| URL | Status before this task | Status after this task |
|---|---|---|
| `https://aeplatform.app` | old "Coming Soon" page | **UNCHANGED** — same ETag, cache HIT |
| `https://www.aeplatform.app` | old "Coming Soon" page | **UNCHANGED** — same ETag, cache HIT |
| `https://frontend-aeplatform-apps-projects.vercel.app` | old "Coming Soon" page | **UNCHANGED** — same ETag, cache HIT |
| `https://frontend-aeplatform-app-aeplatform-apps-projects.vercel.app` | old "Coming Soon" page (was a production alias) | **CHANGED** — now serves the new Singy preview build |

The production deployment record itself (`dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf`) is unchanged: still `readyState: READY`, still `target: production`, its own `alias` array still lists both original hostnames. But live traffic to the one affected hostname now resolves to the new deployment (`dpl_FAifrt1vvCwCSHLfTpdhD7ugaYuV`), whose own record explicitly lists that hostname under `alias`. This is confirmed by direct HTTP fetch of both URLs, not just API metadata.

**What this means for the owner:** the public domain `aeplatform.app` — what real visitors and the site's own robots/SEO policy care about — was never touched and still shows the old Coming Soon page. Only one secondary, non-custom, Vercel-generated URL that happened to also be attached to production is now showing the new candidate site instead. That URL remains `noindex` either way (both old and new pages set it), so this is not a public-indexing exposure, but it is still a real, unrequested change to something production-adjacent, which the task explicitly asked to avoid and to report precisely rather than gloss over.

**No remediation was attempted.** `vercel alias` is on the explicit forbidden-commands list for this task, so no attempt was made to manually reassign that hostname back. This is left for the owner to decide (likely a one-click fix in the Vercel dashboard, or it may be judged not to matter since it's not the custom domain).

## Screenshot gap

Real screenshots of the live deployment URL were **not** captured in this session, despite three attempts via three different tools:

1. In-app Browser pane — navigated successfully (confirmed by page title reading correctly), but screenshot capture failed: "the Browser pane is not displayed, so the page is not compositing frames." Same failure mode as earlier in this task against localhost, now also against the external URL.
2. Claude-in-Chrome — no Chrome browser connected to this account in this environment.
3. A local headless-Chromium (Playwright) script — the same tool that successfully captured all 6 screenshots against the local build earlier in this task — was denied twice by the Claude Code auto-mode permission classifier when pointed at the external `https://` deployment URL (it was not denied against `localhost` earlier). Retried once to rule out a transient issue; denied again with the same reason. Not worked around.

As the closest honest substitute: the deployed JS/CSS asset filenames (`index-lMwanoXv.js`, `index-CSmOBMm6.css`) are Vite content-hashed and match the local `public-website/dist/` build byte-for-byte in name, meaning the deployed bundle is the identical artifact that was already screenshotted and visually reviewed (6/6 PASS) in the prior phase of this task. This is supporting evidence of visual correctness, but it is **not** a screenshot of the actual live deployment taken in this session, and is reported as such rather than substituted silently.

## Result

Per your explicit instruction, because a production-adjacent alias changed unexpectedly and real screenshots of the live deployment could not be captured, **the target success status `UAOS_SINGY_KIDS_TEEN_VERCEL_PREVIEW_DEPLOYED_READY_FOR_OWNER_REVIEW` is NOT used.** See the final structured report for the honest status used instead.
