# Alias Incident Recovery — Attempt Report

## Outcome: recovery NOT performed — no safe tool available

Per this task's own strict rules ("لا تستخدم Vercel CLI المحلي غير المسجل دخوله" / "استخدم فقط Vercel MCP أو Dashboard المتصل بالحساب الصحيح"), only the connected Vercel MCP integration or the Dashboard were permitted paths. I checked exhaustively for an alias-assignment capability in the connected Vercel MCP server and found **none**:

**Available Vercel MCP tools in this session:** `list_projects`, `get_project`, `list_deployments`, `get_deployment`, `get_deployment_build_logs`, `deploy_to_vercel`, `get_project_deployment_protection`, `update_project_deployment_protection`, `get_access_to_vercel_url`, `web_fetch_vercel_url`, `list_teams`, plus unrelated purchase tools (`buy_domain`, `buy_credits`, `buy_pro`, `buy_addon`, `get_purchase_quote`, `get_domain_order`, `check_domain_availability_and_price`), and `search_vercel_documentation`.

**None of these can create, move, or delete a deployment alias.** I confirmed via `search_vercel_documentation` that Vercel's REST API does expose exactly the right endpoint (`POST /v2/deployments/{id}/aliases`, the "assign an alias" operation — functionally identical to `vercel alias set`), but it is not wrapped by any tool available to me, and I have no bearer token to call the Vercel API directly (the MCP server holds that credential internally and never exposes it to me — calling the raw API myself is not possible without one, and I will not attempt to obtain, guess, or construct one).

The local Vercel CLI has stored no credentials in this environment (confirmed in the prior task phase — it started an interactive OAuth device-flow prompt that cannot complete without a human visiting a URL) and using it was explicitly disallowed for this task regardless.

Per your own instruction — "إذا لم توفر الأدوات المتاحة عملية Alias آمنة ومحددة، توقف ولا تحذف أي شيء، وأعد خطوات Dashboard الدقيقة للمالك" — I stopped here rather than improvise a workaround, deleted nothing, and changed nothing. Current state is byte-for-byte identical to the state at the end of the prior task phase (see `alias-state-before.json` / `alias-state-after.json` — they are intentionally identical because no action was taken between them).

## Exact Dashboard steps for the owner

1. Sign in to the Vercel dashboard as the `aeplatform-app` account/team (`team_5pDwLd3tPHdmo4oP7au7pclJ`).
2. Open project **frontend** (`prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI`).
3. Go to the **Deployments** tab and open the deployment with ID `dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf` (unique URL: `frontend-90wiltv3n-aeplatform-apps-projects.vercel.app`, marked "Production", created via `cursor-cli`). This is the deployment currently serving the live "Coming Soon" page at `aeplatform.app`.
4. On that deployment's page, open the **"..." (overflow) menu** → **"Assign Domain"** (or, from the project's **Domains** settings tab, find the row for `frontend-aeplatform-app-aeplatform-apps-projects.vercel.app`).
5. Reassign/point `frontend-aeplatform-app-aeplatform-apps-projects.vercel.app` to deployment `dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf` (the one from step 3). Vercel will move the alias off its current target (the new preview deployment, `dpl_FAifrt1vvCwCSHLfTpdhD7ugaYuV`) automatically as part of this action — that is expected and correct.
6. Do **not** touch `aeplatform.app` or `www.aeplatform.app` in this process — they were never affected and need no action.
7. Confirm by visiting `https://frontend-aeplatform-app-aeplatform-apps-projects.vercel.app` afterward — it should show the old dark "Coming Soon" page again, not the Singy site.

Equivalent CLI command, if the owner runs it themselves from an authenticated machine (not run by me, per this task's rules):
```
vercel alias set frontend-90wiltv3n-aeplatform-apps-projects.vercel.app frontend-aeplatform-app-aeplatform-apps-projects.vercel.app --scope aeplatform-apps-projects
```

## What remains fine either way

- `aeplatform.app` and `www.aeplatform.app`: **unaffected**, confirmed again in this recovery attempt (see `http-after-recovery.txt`) — still serving the original Coming Soon page, still resolving to `dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf`.
- The preview unique URL `https://frontend-53t7szw2h-aeplatform-apps-projects.vercel.app` continues to work independently and shows the new Singy Kids/Teen candidate site, as intended for owner review.
- No new deployment was created in this task. No promote, rollback, DNS change, or git push occurred.

## Screenshot gap (step 5 of your instructions)

Your instructions gated live-preview screenshot capture on the alias fix succeeding first ("بعد إصلاح الـalias فقط, حاول..."). Since the alias fix could not be performed, that step was not attempted in this task. It remains open from the prior phase.

```text
LIVE_PREVIEW_SCREENSHOTS: BLOCKED_BY_EXECUTION_PERMISSION
```

This is not being used as a justification for creating a new deployment, and none was created.
