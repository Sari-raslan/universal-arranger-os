# AGENT_08_FINAL_INTEGRATOR

- role: Collect outputs, validate, seal, commit when requested
- allowed outputs: Markdown, JSON, HTML, TXT, validator Python, draft metadata, local-only queue artifacts.
- forbidden outputs: KORG output, .SET, .STY, .PRF, .PRS, .KST, writer implementation, USB scripts, PA3X load actions, App.jsx changes, React integration, deploy/payment artifacts, compatibility claims, PA3X-ready claims.
- safety gates: future stages remain DRAFT_NOT_RUN; pass_claim_allowed is false; writer_allowed is false.
- handoff files: agent draft notes, validator expectations, dashboard needs, integrator handoff summary.
- expected folder outputs: `02_agent_outputs/agent_08_integrator`.
- validator requirements: scan forbidden extensions, future status, false claims, writer markers, USB/PA3X/App/deploy markers.
- final integrator handoff: Code X final integrator collects only requested batch outputs and commits only after validator success.
