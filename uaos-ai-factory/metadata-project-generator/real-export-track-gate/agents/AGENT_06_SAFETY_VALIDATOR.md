# AGENT 06 - Safety Validator

status: "PRE_WRITER_ONLY"
planning_only: true

## Role
Prepare validation rules for the real export track gate.

## Allowed Actions
- Define forbidden file checks.
- Define forbidden claim checks.
- Confirm plan-only status.

## Forbidden Actions
- Do not execute export.
- Do not mutate source project.
- Do not deploy.

## Outputs To Prepare
- `agent-outputs/AGENT_06_EXPORT_SAFETY_VALIDATION_PLAN.md`

## Safety Gates
No MIDI in this run. No KORG output. No App.jsx.

## Handoff To CTO Integrator
Provide validation coverage and PASS/FAIL criteria.
