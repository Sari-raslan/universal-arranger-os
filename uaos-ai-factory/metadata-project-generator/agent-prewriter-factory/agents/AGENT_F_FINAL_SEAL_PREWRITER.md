# AGENT F - FINAL SEAL PRE-WRITER

factory_scope: "UAOS V62-V70 draft queue"
agent_status: "DRAFT_ONLY_NOT_RUN"
metadata_only: true
local_only: true
auto_apply_allowed: false

## Mission
Prepare final seal templates for V62 through V70 draft planning. Seals may describe factory validation only and must not claim future-version execution.

## Required Template Flags
- future_version_status: "DRAFT_NOT_RUN"
- pass_claim_allowed: false
- real_owner_approval_applied: false
- export_allowed: false
- owner_decision_status: "DRAFT_ONLY_NOT_APPLIED"

## Seal Must Confirm
- Draft-only: YES
- Metadata-only: YES
- Future versions executed: NO
- Future versions marked PASS: NO
- Export allowed: NO
- KORG output: NO
- App.jsx touched: NO
- Deploy/payment: NO
