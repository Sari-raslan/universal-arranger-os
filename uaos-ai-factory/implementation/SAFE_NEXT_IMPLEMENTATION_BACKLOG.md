# Safe Next Implementation Backlog

LOCAL ONLY - FUTURE TASK BOARD - NO REAL KEYBOARD OUTPUT

## Rules For All Tasks

- Local-only.
- No push/deploy/Vercel/payment.
- No real keyboard-native output.
- No `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST`.
- No legacy file move/delete/restore.
- No proprietary samples or Kontakt/Native Instruments content.

## Backlog

| ID | Task | Risk | Owner Approval | Expected Report |
| --- | --- | --- | --- | --- |
| SAFE-001 | owner-neutral-003 generation | LOW | YES | `uaos-ai-factory/implementation/reports/SAFE_001_OWNER_NEUTRAL_003_GENERATION_REPORT.md` |
| SAFE-002 | metadata validation improvement | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_002_METADATA_VALIDATION_IMPROVEMENT_REPORT.md` |
| SAFE-003 | UI read-only owner review panel | MEDIUM | YES | `uaos-ai-factory/implementation/reports/SAFE_003_UI_READ_ONLY_OWNER_REVIEW_PANEL_REPORT.md` |
| SAFE-004 | screenshot/send pack cleanup | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_004_SCREENSHOT_SEND_PACK_CLEANUP_REPORT.md` |
| SAFE-005 | safe writer research notes | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_005_SAFE_WRITER_RESEARCH_NOTES_REPORT.md` |
| SAFE-006 | quarantine metadata review | MEDIUM | YES | `uaos-ai-factory/implementation/reports/SAFE_006_QUARANTINE_METADATA_REVIEW_REPORT.md` |
| SAFE-007 | local QA dashboard improvement | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_007_LOCAL_QA_DASHBOARD_IMPROVEMENT_REPORT.md` |
| SAFE-008 | business pack polish | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_008_BUSINESS_PACK_POLISH_REPORT.md` |
| SAFE-009 | GitHub transfer wait check | LOW | YES | `uaos-ai-factory/implementation/reports/SAFE_009_GITHUB_TRANSFER_WAIT_CHECK_REPORT.md` |
| SAFE-010 | final local handoff pack | LOW | NO | `uaos-ai-factory/implementation/reports/SAFE_010_FINAL_LOCAL_HANDOFF_PACK_REPORT.md` |

## Per-Task Boundaries

### SAFE-001 owner-neutral-003 generation

- Allowed paths: `uaos-ai-factory/writer-sandbox/neutral-package-writer`, `uaos-ai-factory/implementation`
- Forbidden paths: App.jsx, frontend source, deploy files, legacy keyboard files
- Risk: LOW
- Owner approval needed: YES

### SAFE-002 metadata validation improvement

- Allowed paths: `scripts/uaos-ai-factory-*.mjs`, `uaos-ai-factory/implementation`
- Forbidden paths: App.jsx, deploy files, keyboard-native outputs
- Risk: LOW
- Owner approval needed: NO

### SAFE-003 UI read-only owner review panel

- Allowed paths: only after explicit approval for UI file
- Forbidden paths: deploy files, payment, writer/export code
- Risk: MEDIUM
- Owner approval needed: YES

### SAFE-004 screenshot/send pack cleanup

- Allowed paths: `uaos-ai-factory`, `docs`, `reports`
- Forbidden paths: App.jsx, email sending, deploy commands
- Risk: LOW
- Owner approval needed: NO

### SAFE-005 safe writer research notes

- Allowed paths: `uaos-ai-factory/writer-sandbox`, `uaos-ai-factory/implementation`
- Forbidden paths: keyboard-native outputs, legacy binary reads
- Risk: LOW
- Owner approval needed: NO

### SAFE-006 quarantine metadata review

- Allowed paths: metadata/report files only
- Forbidden paths: legacy file movement, deletion, content copying
- Risk: MEDIUM
- Owner approval needed: YES

### SAFE-007 local QA dashboard improvement

- Allowed paths: `scripts/uaos-ai-factory-*.mjs`, `package.json`, reports
- Forbidden paths: deploy scripts, App.jsx, payment
- Risk: LOW
- Owner approval needed: NO

### SAFE-008 business pack polish

- Allowed paths: `uaos-ai-factory`, `docs`, `reports`
- Forbidden paths: production release, public URLs, deploy
- Risk: LOW
- Owner approval needed: NO

### SAFE-009 GitHub transfer wait check

- Allowed paths: reports/docs only
- Forbidden paths: remote changes, push, transfer execution
- Risk: LOW
- Owner approval needed: YES

### SAFE-010 final local handoff pack

- Allowed paths: `uaos-ai-factory`, `docs`, `reports`
- Forbidden paths: App.jsx, deploy, keyboard output
- Risk: LOW
- Owner approval needed: NO
