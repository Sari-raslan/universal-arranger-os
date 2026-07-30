# Incident: Accidental New Vercel Project Created

## What happened

While attempting to create a Preview deployment of the Visual V3 site (per the "Resume from verified local commit" task, step 5: `vercel deploy --yes`), the command was run from `.../isolated-worktree-20260730-173525/public-website` **without first linking that directory to the existing `frontend` project** (no `.vercel/project.json` was written pointing at `prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI`, unlike what the reviewed V8 script does correctly before deploying).

Because the directory was unlinked, `vercel deploy --yes` did not prompt to attach to an existing project — it silently:
1. **Created a new Vercel project** named `public-website` (matching the folder's basename), ID `prj_8l8rN7oWDfqlLYB4pzVgy8l79GT3`, under the same team/account (`aeplatform-apps-projects`).
2. **Deployed it with `target: "production"`** — even though `--prod` was never passed. This is standard (if surprising) Vercel CLI behavior: the first deployment to a brand-new, unlinked project becomes that project's production deployment by default.

This directly violates this task's explicit rules ("ممنوع: --prod", and implicitly, never create a new Vercel project — a rule stated explicitly in the prior alias-recovery task and assumed to still hold). It was not intentional and was not a deliberate attempt to bypass any rule — it was a process error: skipping the project-linking step before deploying.

## Verified blast radius (read-only checks via Vercel MCP, after the fact)

| Resource | Status |
|---|---|
| Project `frontend` (`prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI`) | **UNCHANGED** — `latestDeployment` still points to the earlier preview (`dpl_FAifrt1vvCwCSHLfTpdhD7ugaYuV`, target `null`) |
| `aeplatform.app` | **UNCHANGED** — not in the new project's domain list at all |
| `www.aeplatform.app` | **UNCHANGED** — not in the new project's domain list at all |
| `uaos.app` / `www.uaos.app` | **UNCHANGED** — not in the new project's domain list at all |
| New project `public-website` (`prj_8l8rN7oWDfqlLYB4pzVgy8l79GT3`) | Created, live, deployment `dpl_EMKrgdFoGcsiqnpzJC9ZFVwEYnja`, `target: production`, `readyState: READY` |
| New project's domains | Only auto-generated `*.vercel.app` subdomains: `public-website-five-coral.vercel.app`, `public-website-aeplatform-apps-projects.vercel.app`, `public-website-aeplatform-app-aeplatform-apps-projects.vercel.app` — no custom domain attached |

The deployed content itself is the Visual V3 site (Singy Kids/Teen only, `noindex` — not independently re-verified as part of this incident report, since the point here is documenting the process error, not endorsing the content as reviewed).

## What was NOT done in response

- No attempt was made to delete the new project or its deployment. Deletion is itself a destructive, hard-to-reverse action that wasn't explicitly authorized, and attempting it without being certain of the correct safe method risked compounding the mistake.
- No further Vercel CLI or MCP mutation of any kind was attempted after this was discovered. The alias-restore step and the screenshot-capture step from the "Resume" task were **not attempted** — they are on hold pending your decision on this incident.

## Recommended owner action

1. Decide whether to keep or delete the `public-website` project (`prj_8l8rN7oWDfqlLYB4pzVgy8l79GT3`) via the Vercel dashboard — it's harmless in the sense that no custom domain points to it and nothing else depends on it, but it's an unintended artifact.
2. If a Preview deployment of the Visual V3 site is still wanted, it needs to be done **linked to the existing `frontend` project** (writing `.vercel/project.json` with `projectId: prj_LiH0Xa5ygloqKzdtUzVUKnGDDPTI` and `orgId: team_5pDwLd3tPHdmo4oP7au7pclJ` before running `vercel deploy`), the way the V8 script does it, not run unlinked.
3. The original alias-recovery goal (`frontend-aeplatform-app-aeplatform-apps-projects.vercel.app` → old production `dpl_J6sBbM1rwoWmir1RHLBoiGeUvEUf`) is still unresolved and independent of this incident.

## Note on Vercel CLI authentication state

Contrary to earlier findings in this session (where `vercel whoami` reported "Not authorized" even after `vercel login` reported success), this `vercel deploy` command clearly executed with real, working credentials for the `aeplatform-app` account (visible in the resulting deployment's creator field: `uid: e9vU5EPeUQfmkQcIfipfcKRq`, `username: aeplatform-app`, matching the same identity behind the `frontend` project's own deployments). The CLI **can** authenticate and perform real, live mutations in this environment — `whoami`'s "Not authorized" response was misleading and should not be relied on as proof of no access. This raises the stakes of any further exploratory CLI commands: they are not harmlessly no-op'ing, they can and do execute for real.
