# Safe Development Backlog V2

LOCAL ONLY - FUTURE DEVELOPMENT BOARD - NO KEYBOARD OUTPUT

## Rules

- Local-only.
- No push/deploy/Vercel/payment.
- No App.jsx or frontend source changes unless separately approved.
- No keyboard-native output.
- No legacy file movement/deletion/restore.
- No proprietary samples or Kontakt / Native Instruments content.

## Tasks

| ID | Task | Risk | Owner Approval | Expected Output |
| --- | --- | --- | --- | --- |
| DEVNEXT-001 | neutral package browser data model | LOW | NO | Data model JSON/MD spec |
| DEVNEXT-002 | read-only UI proposal for selected package | MEDIUM | YES | UI proposal document only |
| DEVNEXT-003 | metadata diff tool owner-neutral-002 vs 003 | LOW | NO | Diff script and report |
| DEVNEXT-004 | validation aggregator improvements | LOW | NO | Aggregator v2 report/status |
| DEVNEXT-005 | neutral package export zip plan, no binary output | MEDIUM | YES | Zip plan only |
| DEVNEXT-006 | safe writer research roadmap | LOW | NO | Research roadmap |
| DEVNEXT-007 | legacy quarantine metadata tooling | MEDIUM | YES | Metadata tooling plan |
| DEVNEXT-008 | business pack automation notes | LOW | NO | Automation notes document |
| DEVNEXT-009 | local owner dashboard UI proposal | MEDIUM | YES | Dashboard UI proposal |
| DEVNEXT-010 | final local release candidate checklist | LOW | NO | Local RC checklist |

## DEVNEXT-001 - neutral package browser data model

Goal: Define a local read-only data model for browsing neutral packages.

Allowed paths:
- uaos-ai-factory/writer-sandbox/neutral-package-writer
- uaos-ai-factory/implementation

Forbidden paths/actions:
- App.jsx
- frontend source
- keyboard-native output

Risk level: LOW

Owner approval required: NO

Expected output: Data model JSON/MD spec

Stop condition: Stop if UI code or keyboard-native output is requested.

## DEVNEXT-002 - read-only UI proposal for selected package

Goal: Plan a future read-only UI panel without implementation.

Allowed paths:
- uaos-ai-factory/implementation
- docs

Forbidden paths/actions:
- App.jsx unless separately approved
- frontend source changes
- deploy/payment

Risk level: MEDIUM

Owner approval required: YES

Expected output: UI proposal document only

Stop condition: Stop before modifying UI source.

## DEVNEXT-003 - metadata diff tool owner-neutral-002 vs 003

Goal: Create a local diff tool for neutral metadata only.

Allowed paths:
- scripts/uaos-ai-factory-*.mjs
- uaos-ai-factory/implementation

Forbidden paths/actions:
- keyboard-native output
- legacy file reads
- App.jsx

Risk level: LOW

Owner approval required: NO

Expected output: Diff script and report

Stop condition: Stop if binary or legacy content is requested.

## DEVNEXT-004 - validation aggregator improvements

Goal: Improve aggregate status coverage for selected package and catalog.

Allowed paths:
- scripts/uaos-ai-factory-*.mjs
- uaos-ai-factory

Forbidden paths/actions:
- deploy/payment
- App.jsx
- keyboard output

Risk level: LOW

Owner approval required: NO

Expected output: Aggregator v2 report/status

Stop condition: Stop if external automation is requested.

## DEVNEXT-005 - neutral package export zip plan, no binary output

Goal: Plan a future local zip export for neutral docs only.

Allowed paths:
- uaos-ai-factory/implementation
- docs

Forbidden paths/actions:
- real export execution
- keyboard-native files
- production release

Risk level: MEDIUM

Owner approval required: YES

Expected output: Zip plan only

Stop condition: Stop before creating archives or binary outputs.

## DEVNEXT-006 - safe writer research roadmap

Goal: Define safe writer research milestones without format implementation.

Allowed paths:
- uaos-ai-factory/writer-sandbox
- uaos-ai-factory/implementation

Forbidden paths/actions:
- .SET/.STY output
- reverse engineering claims
- proprietary samples

Risk level: LOW

Owner approval required: NO

Expected output: Research roadmap

Stop condition: Stop if real keyboard output is requested.

## DEVNEXT-007 - legacy quarantine metadata tooling

Goal: Plan metadata-only tools around legacy quarantine state.

Allowed paths:
- uaos-ai-factory/writer-sandbox
- uaos-ai-factory/implementation

Forbidden paths/actions:
- moving/deleting/restoring files
- binary reads
- content copying

Risk level: MEDIUM

Owner approval required: YES

Expected output: Metadata tooling plan

Stop condition: Stop if file movement or deletion is requested.

## DEVNEXT-008 - business pack automation notes

Goal: Document safe local-only automation notes without running automation.

Allowed paths:
- uaos-ai-factory/implementation
- docs
- reports

Forbidden paths/actions:
- external automation
- email sending
- public URLs

Risk level: LOW

Owner approval required: NO

Expected output: Automation notes document

Stop condition: Stop if sending/uploading is requested.

## DEVNEXT-009 - local owner dashboard UI proposal

Goal: Plan owner dashboard improvements without changing UI.

Allowed paths:
- uaos-ai-factory/implementation
- docs

Forbidden paths/actions:
- App.jsx unless approved
- frontend source
- deploy/payment

Risk level: MEDIUM

Owner approval required: YES

Expected output: Dashboard UI proposal

Stop condition: Stop before modifying UI files.

## DEVNEXT-010 - final local release candidate checklist

Goal: Create a local RC checklist that keeps release blocked.

Allowed paths:
- uaos-ai-factory/implementation
- docs
- reports

Forbidden paths/actions:
- production release files
- deploy
- payment
- keyboard output

Risk level: LOW

Owner approval required: NO

Expected output: Local RC checklist

Stop condition: Stop if public/production release is requested.

