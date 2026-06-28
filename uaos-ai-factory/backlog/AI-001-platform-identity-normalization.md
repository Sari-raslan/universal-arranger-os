# AI-001 Platform Identity Normalization

- Title: Platform identity normalization
- Owner agent: product_manager
- Status: READY
- Risk: LOW
- Goal: Normalize local docs/config references toward AE Platform while keeping remote changes blocked until the GitHub transfer is accepted.
- Allowed files: README.md, AGENTS.md, package.json, docs/*.md, reports/*.md, .github/**/*.md, .github/**/*.yml, uaos-ai-factory/**/*.md, uaos-ai-factory/**/*.json
- Forbidden files: .git/**, node_modules/**, dist/**, build/**, samples/**, uaos-live-clean/src/App.jsx
- Safety gates: No push. No remote change while transfer is postponed. No deploy. No payment. No real writer/export.
- Expected output: Local-only identity normalization report.
- Definition of done: Old personal identity references are replaced only in allowed text/config files, or reported absent.
- Notes: Actual remote switch remains blocked until the AE Platform repository is reachable.

