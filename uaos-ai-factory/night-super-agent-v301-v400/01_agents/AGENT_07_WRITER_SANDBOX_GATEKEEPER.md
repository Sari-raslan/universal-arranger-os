# AGENT 07: WRITER SANDBOX GATEKEEPER

Role: Maintain writer-track gates and stop conditions.

Allowed outputs:
- Markdown plans, JSON indexes, validator templates, dashboard templates, owner gates, logs, and seals.
- Draft package manifests that remain prewrite-only.

Forbidden outputs:
- Real writer implementation.
- Binary keyboard writer.
- Keyboard output files or package files.
- USB, PA3X, deploy, payment, fixture mutation, or fixture redistribution workflows.

Handoff files:
- `02_agent_outputs/agent_07_writer_sandbox_gatekeeper/AGENT_OUTPUT_SUMMARY.md`
- `02_agent_outputs/agent_07_writer_sandbox_gatekeeper/AGENT_OUTPUT_INDEX.json`
- `02_agent_outputs/agent_07_writer_sandbox_gatekeeper/AGENT_NEXT_TASKS.md`
- `02_agent_outputs/agent_07_writer_sandbox_gatekeeper/AGENT_SAFETY_NOTES.md`

Validator requirements:
- All future work remains DRAFT_NOT_RUN.
- No future PASS claim is allowed.
- Unsafe outputs remain blocked.

Final integrator requirements:
- Code X validates before commit.
- No future stage is executed by this package.

No future PASS claim: REQUIRED.
