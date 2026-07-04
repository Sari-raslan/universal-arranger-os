import json
from datetime import datetime, timezone
from pathlib import Path


GATE = Path(__file__).resolve().parents[1]
RESULTS = GATE / "validators" / "UAOS_REAL_EXPORT_TRACK_GATE_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    "decision-gate/UAOS_REAL_EXPORT_TRACK_DECISION_GATE.md",
    "decision-gate/UAOS_REAL_EXPORT_TRACK_DECISION_GATE.json",
    "export-paths/UAOS_LEVEL_1_REAL_MIDI_EXPORT_PLAN.md",
    "export-paths/UAOS_LEVEL_2_UAOS_PROJECT_PACKAGE_EXPORT_PLAN.md",
    "export-paths/UAOS_LEVEL_3_GENERIC_STYLE_PACKAGE_EXPORT_PLAN.md",
    "export-paths/UAOS_LEVEL_4_KORG_RESEARCH_ONLY_PLAN.md",
    "export-paths/UAOS_LEVEL_5_KORG_WRITER_SANDBOX_BLOCKED_PLAN.md",
    "export-paths/UAOS_LEVEL_6_REAL_KORG_EXPORT_BLOCKED_PLAN.md",
    "owner-approval/UAOS_REAL_EXPORT_OWNER_APPROVAL_FORM.md",
    "owner-approval/UAOS_REAL_EXPORT_OWNER_APPROVAL_FORM.json",
    "owner-approval/UAOS_REAL_EXPORT_APPROVAL_TEXT_AR.md",
    "owner-approval/UAOS_REAL_EXPORT_APPROVAL_TEXT_EN.md",
    "implementation-plan/UAOS_FASTEST_REAL_EXPORT_SEQUENCE.md",
    "implementation-plan/UAOS_REAL_EXPORT_BATCH_PLAN_V71_V80.md",
    "implementation-plan/UAOS_REAL_MIDI_EXPORT_TECHNICAL_SPEC.md",
    "implementation-plan/UAOS_UAOS_PROJECT_PACKAGE_TECHNICAL_SPEC.md",
    "implementation-plan/UAOS_GENERIC_STYLE_PACKAGE_TECHNICAL_SPEC.md",
    "dashboards/UAOS_REAL_EXPORT_TRACK_GATE_DASHBOARD.html",
    "dashboards/UAOS_REAL_EXPORT_LEVELS_DASHBOARD.html",
    "reports/UAOS_REAL_EXPORT_TRACK_GATE_QA_REPORT.md",
    "reports/UAOS_REAL_EXPORT_TRACK_GATE_OWNER_DASHBOARD.md",
    "reports/UAOS_REAL_EXPORT_TRACK_GATE_EXECUTIVE_SUMMARY.md",
    "logs/UAOS_REAL_EXPORT_TRACK_GATE_LOG.txt",
    "seal/UAOS_REAL_EXPORT_TRACK_GATE_FINAL_SEAL.md",
]

FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "real_owner_approval_applied: true",
    '"real_owner_approval_applied": true',
    "korg_output_created: true",
    '"korg_output_created": true',
    "midi_created_in_this_run: true",
    '"midi_created_in_this_run": true',
    "korg writer implementation",
    "react integration: yes",
    "deploy/payment: yes",
    "compatibility claim: yes",
    "pa3x-ready claim: yes",
    "usb write: yes",
    "pa3x load: yes",
]


def main():
    required = [{"path": rel, "exists": (GATE / rel).exists()} for rel in REQUIRED_FILES]
    forbidden_files = []
    forbidden_claims = []
    level_execution_findings = []

    for path in GATE.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(GATE).as_posix()
        if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
            forbidden_files.append(rel)
        if path == RESULTS or path.suffix.lower() == ".py":
            continue
        if path.suffix.lower() not in {".md", ".json", ".html", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        lowered = text.lower()
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in lowered:
                forbidden_claims.append({"path": rel, "pattern": pattern})
        if rel.startswith("export-paths/UAOS_LEVEL_") and "planning_only: true" not in text:
            level_execution_findings.append(rel)

    decision_gate = json.loads((GATE / "decision-gate" / "UAOS_REAL_EXPORT_TRACK_DECISION_GATE.json").read_text(encoding="utf-8"))
    level_123_plan_only = all(not item.get("executed_now", False) for item in decision_gate["levels"] if item["level"] in {1, 2, 3})
    real_korg_blocked = any(item["level"] == 6 and item["status"] == "BLOCKED_NOT_ALLOWED_NOW" for item in decision_gate["levels"])

    passed = (
        all(item["exists"] for item in required)
        and not forbidden_files
        and not forbidden_claims
        and not level_execution_findings
        and level_123_plan_only
        and real_korg_blocked
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "factory_path": str(GATE),
        "level_1_midi_path_prepared": True,
        "level_2_uaos_package_path_prepared": True,
        "level_3_generic_package_path_prepared": True,
        "korg_writer_blocked": True,
        "real_korg_export_blocked": real_korg_blocked,
        "korg_output_created": False,
        "midi_created_in_this_run": False,
        "usb_write": False,
        "pa3x_load": False,
        "app_jsx_touched": False,
        "deploy_payment": False,
        "required_files": required,
        "forbidden_files": forbidden_files,
        "forbidden_claims": forbidden_claims,
        "level_execution_findings": level_execution_findings
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
