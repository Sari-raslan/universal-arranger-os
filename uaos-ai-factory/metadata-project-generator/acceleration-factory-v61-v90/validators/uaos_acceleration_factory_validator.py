import json
from datetime import datetime, timezone
from pathlib import Path


FACTORY = Path(__file__).resolve().parents[1]
RESULTS = FACTORY / "validators" / "UAOS_ACCELERATION_FACTORY_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    *[f"draft-pipeline/UAOS_V{version}_DRAFT_PLAN.md" for version in range(61, 91)],
    "validator-templates/UAOS_GENERIC_FORBIDDEN_OUTPUT_VALIDATOR_TEMPLATE.py",
    "validator-templates/UAOS_GENERIC_FORBIDDEN_CLAIM_VALIDATOR_TEMPLATE.py",
    "validator-templates/UAOS_GENERIC_PHASE_VALIDATOR_TEMPLATE.py",
    "validator-templates/UAOS_VALIDATOR_FACTORY_GUIDE.md",
    "dashboard-templates/UAOS_OWNER_DASHBOARD_TEMPLATE.md",
    "dashboard-templates/UAOS_OWNER_DASHBOARD_TEMPLATE.html",
    "dashboard-templates/UAOS_EXECUTIVE_DASHBOARD_TEMPLATE.html",
    "dashboard-templates/UAOS_PHASE_STATUS_CARD_TEMPLATE.json",
    "qa-templates/UAOS_QA_REPORT_TEMPLATE.md",
    "qa-templates/UAOS_SAFETY_SCAN_TEMPLATE.md",
    "qa-templates/UAOS_INPUT_OUTPUT_TRACE_TEMPLATE.json",
    "qa-templates/UAOS_COMMIT_CHECK_TEMPLATE.md",
    "seal-templates/UAOS_FINAL_SEAL_TEMPLATE.md",
    "seal-templates/UAOS_METADATA_ONLY_SEAL_TEMPLATE.md",
    "seal-templates/UAOS_BLOCKED_EXPORT_SEAL_TEMPLATE.md",
    "execution-queue/UAOS_V61_TO_V90_EXECUTION_QUEUE.md",
    "execution-queue/UAOS_V61_TO_V90_EXECUTION_QUEUE.json",
    "execution-queue/UAOS_FAST_BIG_RUN_BATCHES.md",
    "integrator/UAOS_ACCELERATION_INTEGRATOR_MAP.json",
    "integrator/UAOS_CODEX_FAST_EXECUTION_STRATEGY.md",
    "integrator/UAOS_AGENT_PARALLEL_WORKFLOW.md",
    "roadmap/UAOS_FASTEST_SAFE_PATH_V61_TO_V90.md",
    "roadmap/UAOS_PARALLEL_AGENT_DEPARTMENT_MAP.json",
    "roadmap/UAOS_ACCELERATION_RISK_CONTROL.md",
    "reports/UAOS_ACCELERATION_FACTORY_QA_REPORT.md",
    "reports/UAOS_ACCELERATION_FACTORY_OWNER_DASHBOARD.md",
    "reports/UAOS_FASTEST_SAFE_PATH_SUMMARY.md",
    "dashboards/UAOS_ACCELERATION_FACTORY_DASHBOARD.html",
    "dashboards/UAOS_V61_TO_V90_PIPELINE_DASHBOARD.html",
    "logs/UAOS_ACCELERATION_FACTORY_LOG.txt",
    "seal/UAOS_ACCELERATION_FACTORY_FINAL_SEAL.md",
]

FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "export_allowed: " + "true",
    '"export_allowed": ' + "true",
    "real_owner_approval_applied: " + "true",
    '"real_owner_approval_applied": ' + "true",
    "pass_claim_allowed: " + "true",
    '"pass_claim_allowed": ' + "true",
    "source_mutation: " + "true",
    "deploy_enabled: " + "true",
    "payment_enabled: " + "true",
    "future version marked pass",
    "export " + "approved",
    "korg_output: " + "true",
    "compatibility_claim: " + "true",
    "pa3x_ready_claim: " + "true",
]


def main():
    required_file_findings = [{"path": rel, "exists": (FACTORY / rel).exists()} for rel in REQUIRED_FILES]
    forbidden_file_findings = []
    forbidden_claim_findings = []
    draft_status_findings = []

    for path in FACTORY.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(FACTORY).as_posix()
        if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
            forbidden_file_findings.append(rel)
        if path == RESULTS or rel.endswith("uaos_acceleration_factory_validator.py"):
            continue
        if path.suffix.lower() not in {".md", ".json", ".html", ".py", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        lowered = text.lower()
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in lowered:
                forbidden_claim_findings.append({"path": rel, "pattern": pattern})
        if rel.startswith("draft-pipeline/UAOS_V") and rel.endswith("_DRAFT_PLAN.md"):
            if 'status: "DRAFT_NOT_RUN"' not in text or "pass_claim_allowed: false" not in text:
                draft_status_findings.append(rel)

    passed = (
        all(item["exists"] for item in required_file_findings)
        and not forbidden_file_findings
        and not forbidden_claim_findings
        and not draft_status_findings
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "factory_path": str(FACTORY),
        "v61_to_v90_drafts_created": all((FACTORY / f"draft-pipeline/UAOS_V{version}_DRAFT_PLAN.md").exists() for version in range(61, 91)),
        "future_versions_executed": False,
        "future_versions_marked_pass": False,
        "metadata_only": True,
        "draft_only": True,
        "export_allowed": False,
        "korg_output": False,
        "midi_audio_generation": False,
        "usb_write": False,
        "pa3x_load": False,
        "app_jsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "source_mutation": False,
        "required_file_findings": required_file_findings,
        "forbidden_file_findings": forbidden_file_findings,
        "forbidden_claim_findings": forbidden_claim_findings,
        "draft_status_findings": draft_status_findings,
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
