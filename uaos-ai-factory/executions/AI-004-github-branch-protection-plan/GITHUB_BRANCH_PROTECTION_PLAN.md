# GitHub Branch Protection Plan

This is a local planning document. No GitHub settings were changed.

- Target repo: `aeplatform-app/universal-arranger-os`
- Current status: planning only
- Default branch currently expected: `master`

## Future Branches

- `master` or `main`: protected stable branch
- `develop`: integration branch
- `staging`: preview branch
- `ai/*`: AI worker branches
- `fix/*`: bug fix branches
- `docs/*`: documentation branches

## Protection Rules

- No direct push to protected branches.
- No automatic merge by AI.
- No force push.
- No deletion of protected branches.
- Pull request required for protected branches.
- Required status checks before merge.
- Human approval required for high-risk changes.

