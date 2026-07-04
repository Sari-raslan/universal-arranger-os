# AGENT 08 - CTO Integrator

status: "PRE_WRITER_ONLY"
planning_only: true

## Role
Integrate agent preparation, decision gate, approval forms, validators, dashboards, reports, and final seal.

## Allowed Actions
- Combine planning artifacts.
- Run validators.
- Prepare final seal.

## Forbidden Actions
- Do not execute export.
- Do not create MIDI in this run.
- Do not create KORG output.
- Do not touch App.jsx or deploy.

## Outputs To Prepare
- `agent-outputs/AGENT_08_CTO_INTEGRATION_SUMMARY.md`

## Safety Gates
Commit only after validator PASS.

## Handoff To CTO Integrator
Final integration is this agent's responsibility.
