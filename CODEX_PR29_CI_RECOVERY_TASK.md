You are working inside the UAOS repository:

Repository:
Sari-raslan/universal-arranger-os

Current branch:
codex/uaos-electron-runtime-hardening

Pull request:
#29

Primary objective:
Fix all failing GitHub Actions checks for PR #29 without weakening tests, disabling CI, hiding errors, deleting legitimate functionality, force-pushing, or merging before every required check is green.

Known verified runtime state:
- Frontend production runtime: PASS at http://127.0.0.1:5180
- Backend runtime: PASS at http://127.0.0.1:5199/health
- Frontend production build has completed successfully
- Backend syntax has passed
- API health/version/status/presets routes pass
- Pattern generation API passes
- Branch was synchronized before the latest CI work

Known CI failures:
- UAOS CI / validate
- UAOS Full Validation / validate
- Failures occur in the Check step
- Workflow installs root, backend, web app, and desktop successfully
- Check runs npm run check
- npm run check runs:
  node scripts/uaos-static-check.mjs && npm test

Known local failures:
1. Static check reports:
   uaos-live-clean/src/daw/projectModel.js uses Math.random
   uaos-live-clean/src/daw/timelineModel.js uses Math.random

2. Tests report:
   Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'nodemailer'
   imported from:
   server/production/smtpEmailService.mjs

3. The failing test file includes:
   tests/production-integrations.test.mjs

4. Previous full tests showed approximately 10 assertion failures.
   Some expectations showed actual 1 versus expected 7, and false versus true.
   Do not blindly change expectations. Inspect implementation and fixtures and determine whether production configuration, environment defaults, fixture discovery, feature inventory, or route counting is wrong.

5. Frontend build warning:
   /uaos-final-concept-reference.png did not resolve at build time.
   This warning is currently non-blocking. Only fix it if the referenced asset is actually missing or incorrectly addressed.

Execution requirements:

PHASE 1 - Preflight
- Confirm current branch.
- Run git status --short.
- Confirm gh authentication.
- Inspect PR #29 metadata and current checks.
- Do not discard unrelated user work.
- Create a backup or inspect diffs before modifying tracked files.
- Do not use git reset --hard.
- Do not force push.

PHASE 2 - Inspect exact failures
- Run:
  node scripts/uaos-static-check.mjs
  node --test tests/production-integrations.test.mjs
  npm test
- Capture exact failing test names, assertions, source files, expected values, and actual values.
- Inspect all relevant implementation and test files before editing.
- Inspect package.json and package-lock.json locations to determine where nodemailer belongs.
- Inspect both Math.random call sites and understand why random identifiers are generated.

PHASE 3 - Fix deterministic ID generation
- Replace Math.random use in:
  uaos-live-clean/src/daw/projectModel.js
  uaos-live-clean/src/daw/timelineModel.js
- Use a deterministic or standards-based identifier strategy appropriate to browser and test environments.
- Prefer crypto.randomUUID when safe, with a deterministic fallback that does not contain the literal Math.random.
- Preserve public object shapes and behavior.
- Add or update tests if necessary.
- Ensure scripts/uaos-static-check.mjs passes without weakening its rule.

PHASE 4 - Fix nodemailer dependency
- Add nodemailer to the correct package dependencies.
- Update the correct lock file using npm, not manual lock-file editing.
- Ensure a clean npm ci on Ubuntu can resolve it.
- If smtpEmailService is intended to load nodemailer lazily, preserve correct production behavior while ensuring tests can import the module.
- Never add credentials or secrets.

PHASE 5 - Fix production integration tests
- Focus on tests/production-integrations.test.mjs and any supporting production files.
- Determine why expected 7 becomes actual 1 and why expected true becomes false.
- Check path resolution on Windows versus Ubuntu.
- Check process.cwd usage, glob behavior, route inventory, feature inventory, production config loading, and fixture discovery.
- Fix real implementation defects rather than editing tests to accept broken behavior.
- Only update test expectations when the product behavior has intentionally changed and the source of truth proves the new expectation.
- Keep tests portable across Windows and Ubuntu.

PHASE 6 - Full local validation
Run in this exact order:
1. node scripts/uaos-static-check.mjs
2. node --test tests/production-integrations.test.mjs
3. npm run check
4. npm test
5. npm run build
6. npm run runtime:check
7. npm run desktop:smoke

Also run:
- node --check backend/server.js
- verify uaos-live-clean/dist/index.html exists
- verify no tracked secrets were added
- git diff --check

Do not proceed if any required command fails.
Print the exact failure and continue repairing until all required commands pass, subject to the safety rules.

PHASE 7 - Git review
- Show git diff --stat.
- Show git diff for every modified source, test, package, lock, and workflow file.
- Confirm changes are limited to the CI repair.
- Do not commit generated logs, local backups, node_modules, dist, PID files, or temporary reports.
- Update .gitignore only when genuinely necessary.

PHASE 8 - Commit and push
Only after all required local validation passes:
- Commit with a clear message similar to:
  Fix UAOS CI validation and production integration tests
- Push normally to:
  origin/codex/uaos-electron-runtime-hardening
- Never force push.

PHASE 9 - GitHub Actions follow-up
- Run gh pr checks 29.
- If checks are pending, use gh run list and gh run view to inspect them.
- If new GitHub Actions failures appear, inspect exact failed steps and logs, fix them, validate locally, commit, and push again.
- Continue until both are green:
  UAOS CI / validate
  UAOS Full Validation / validate
- External Vercel checks may be reported but should not be modified unless they fail for a code-related reason.

PHASE 10 - PR readiness
When every required check is green:
- Print a final report containing:
  branch
  latest commit
  git status
  local validation results
  GitHub Actions results
  PR URL
- If PR #29 is still draft, mark it ready for review using:
  gh pr ready 29
- Do not merge PR #29 automatically.
- Stop with the exact merge command that can be run manually after review.

Important:
- Work continuously through the phases.
- Do not stop after merely identifying a failure.
- Do not claim PASS unless the command actually returns exit code 0.
- Preserve working frontend/backend functionality.
- Do not deploy production or modify production secrets.