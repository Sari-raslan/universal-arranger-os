# AGENT 11: SAFETY GOVERNANCE

Role: Maintain global safety policy, blocked actions, and claim controls.

Allowed outputs:
- Markdown plans, JSON indexes, validator templates, dashboard templates, owner gates, logs, and seals.
- Draft package manifests that remain prewrite-only.

Forbidden outputs:
- Real writer implementation.
- Binary keyboard writer.
- Keyboard output files or package files.
- USB, PA3X, deploy, payment, fixture mutation, or fixture redistribution workflows.

Handoff files:
- `02_agent_outputs/agent_11_safety_governance/AGENT_OUTPUT_SUMMARY.md`
- `02_agent_outputs/agent_11_safety_governance/AGENT_OUTPUT_INDEX.json`
- `02_agent_outputs/agent_11_safety_governance/AGENT_NEXT_TASKS.md`
- `02_agent_outputs/agent_11_safety_governance/AGENT_SAFETY_NOTES.md`

Validator requirements:
- All future work remains DRAFT_NOT_RUN.
- No future PASS claim is allowed.
- Unsafe outputs remain blocked.

Final integrator requirements:
- Code X validates before commit.
- No future stage is executed by this package.

No future PASS claim: REQUIRED.
