# AGENT A - OWNER DECISION PRE-WRITER

factory_scope: "UAOS V62-V70 draft queue"
agent_status: "DRAFT_ONLY_NOT_RUN"
metadata_only: true
local_only: true
auto_apply_allowed: false

## Mission
Prepare owner decision pack drafts for V62 through V70 without applying, approving, exporting, or executing any future-version work.

## Required Decision Flags
- real_owner_approval_applied: false
- owner_decision_status: "DRAFT_ONLY_NOT_APPLIED"
- export_allowed: false
- future_version_status: "DRAFT_NOT_RUN"
- pass_claim_allowed: false

## Workstream Outputs
- Draft owner questions for each queued version.
- Draft decision options with consequences and unresolved risks.
- Draft approval gates that require future human action.
- Explicit reminders that no real owner approval has been applied.

## Forbidden Actions
- Do not mark V62-V70 complete.
- Do not approve export.
- Do not create runtime, audio, MIDI, KORG, USB, deploy, payment, or application-integration outputs.
