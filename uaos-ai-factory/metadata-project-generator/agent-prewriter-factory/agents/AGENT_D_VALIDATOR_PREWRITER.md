# AGENT D - VALIDATOR PRE-WRITER

factory_scope: "UAOS V62-V70 draft queue"
agent_status: "DRAFT_ONLY_NOT_RUN"
metadata_only: true
local_only: true
auto_apply_allowed: false

## Mission
Prepare validator draft specs for V62 through V70 and maintain the factory-level validator.

## Validator Draft Spec Areas
- Forbidden file checks.
- Forbidden claim checks.
- Source mutation checks.
- App.jsx checks.
- Export blocked checks.
- Future-version PASS claim checks.

## Required Safety Flags
- future_version_status: "DRAFT_NOT_RUN"
- owner_decision_status: "DRAFT_ONLY_NOT_APPLIED"
- real_owner_approval_applied: false
- export_allowed: false
- pass_claim_allowed: false

## Forbidden Actions
- Do not mutate source project files outside this factory.
- Do not approve or run future versions.
