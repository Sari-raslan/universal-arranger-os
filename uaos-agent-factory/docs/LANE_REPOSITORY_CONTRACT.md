# Lane repository resolution — canonical contract

This is the authoritative description of how the Factory decides which real git
repository a lane (`singy`, `arranger`, `library`) points to, and what it does
when that repository is missing or invalid. It describes `resolveLaneRepository()`
and `validateLaneRepository()` in `src/lane-repositories.mjs`, verified directly
against the implementation as of commit `3f3430b7` — if this file and the code
ever disagree, the code is correct and this file is stale.

## Precedence

Exactly one source wins, in this order. Lower-precedence sources are only
consulted if every higher one is absent:

1. **Explicit environment variable** — `UAOS_ARRANGER_REPO_ROOT`,
   `UAOS_LIBRARY_REPO_ROOT`, or `UAOS_SINGY_REPO_ROOT`, whichever matches the
   lane. Ignored if unset, empty, `.`, or contains `REPLACE_ME`/`CHANGE_ME`
   (a placeholder left behind, not a real configured value).
2. **`config/factory.local.json`** — the lane's `lanes.<lane>.repoRoot`, same
   placeholder-rejection rule as above. This file is gitignored and
   machine-specific; it never gets committed.
3. **Search-root discovery** — *only attempted if both of the above are
   absent.* Scans one level deep under each path in
   `UAOS_PRODUCT_REPO_SEARCH_ROOTS` (a `path.delimiter`-separated list) for a
   directory whose `.uaos-lane` marker file matches the lane. If discovery
   finds **more than one** match, resolution stops immediately with
   `AMBIGUOUS_REPOSITORY_MATCH` — it does **not** fall through to the
   committed config in that case. A single match is used.
4. **Committed `config/factory.json`** — the lane's `lanes.<lane>.repoRoot` as
   checked into git. This is the last resort, and is expected to be a
   portable/generic value, not a specific machine's absolute path.
5. **`LANE_REPOSITORY_NOT_CONFIGURED`** — none of the above produced anything.

## Validation

Whatever path precedence selected (unless the caller explicitly passes
`{ validate: false }`) is then checked by `validateLaneRepository()`, in
order, returning the first failure found:

| `reason` | Meaning |
|---|---|
| `FORBIDDEN_SYSTEM_PATH` | Resolves under `C:\Windows\System32` |
| `IS_AGENT_FACTORY_ITSELF` | Resolves to the Factory's own `FACTORY_ROOT` |
| `IS_RUNTIME_OR_ARTIFACT_DIRECTORY` | Under the Factory's own build/artifact/worktree/logs/state/`.runtime` roots |
| `PATH_DOES_NOT_EXIST` | Nothing at that path |
| `NOT_A_GIT_REPOSITORY` | Path exists but has no git root |
| `PATH_IS_NOT_A_GIT_TOPLEVEL` | It's a subdirectory *inside* a repo, not the repo's own top-level or worktree root |
| `BARE_REPOSITORY_NOT_SUPPORTED` | It's a bare repo |
| `WORKTREE_ROOT_NESTED_INSIDE_REPOSITORY` | The Factory's own worktree root would end up inside this repo's tree |
| `LANE_MISMATCH` | The repo's own `.uaos-lane` marker names a *different* lane |
| `UNRESOLVED_GIT_OPERATION` | Mid-merge, mid-rebase, or mid-cherry-pick (`MERGE_HEAD`/`rebase-merge`/`rebase-apply`/`CHERRY_PICK_HEAD`/`BISECT_LOG` present) |
| `INDEX_LOCKED` | `.git/index.lock` present |

A missing or invalid lane repository blocks only that lane — `resolveLaneRepository()`
never throws, so a caller can always distinguish "this lane isn't configured
right now" from "Agent Factory itself is broken."

## What this replaced

Before `src/paths.mjs`/`src/lane-repositories.mjs` existed, callers read
`repoRoot` directly off `loadFactoryConfig().lanes[lane]`, with no validation
and no override precedence. A committed path from a different machine's drive
layout (`E:\...`, `D:\...`) would silently fail deep inside a `git` invocation,
or — worse — silently resolve to whatever happened to exist at that literal
path on the current machine. This contract exists specifically so that never
happens again: a wrong or absent repository fails with a specific, truthful
reason, not a confusing downstream git error.
