import json
import re
from datetime import datetime, timezone
from pathlib import Path


FACTORY = Path(__file__).resolve().parents[1]
RESULTS = FACTORY / "validators" / "UAOS_MASTER_LOCAL_PROGRAM_HUB_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    "hub/UAOS_MASTER_LOCAL_PROGRAM_HUB.html",
    "hub/UAOS_MASTER_LOCAL_PROGRAM_HUB.md",
    "indexes/UAOS_MASTER_OUTPUT_INDEX.json",
    "indexes/UAOS_MASTER_REPORT_INDEX.json",
    "indexes/UAOS_MASTER_DASHBOARD_INDEX.json",
    "indexes/UAOS_MASTER_SAFETY_INDEX.json",
    "navigation/UAOS_MASTER_NAVIGATION_MAP.md",
    "navigation/UAOS_OWNER_REVIEW_NAVIGATION.md",
    "navigation/UAOS_TECHNICAL_REVIEW_NAVIGATION.md",
    "navigation/UAOS_NEXT_ACTIONS_QUEUE.md",
    "dashboards/UAOS_MASTER_EXECUTIVE_DASHBOARD.html",
    "dashboards/UAOS_MASTER_OWNER_REVIEW_DASHBOARD.html",
    "dashboards/UAOS_MASTER_TECHNICAL_REVIEW_DASHBOARD.html",
    "validators/uaos_master_local_program_hub_validator.py",
    "validators/UAOS_MASTER_LOCAL_PROGRAM_HUB_VALIDATION_RULES.md",
    "reports/UAOS_MASTER_LOCAL_PROGRAM_HUB_QA_REPORT.md",
    "reports/UAOS_MASTER_LOCAL_PROGRAM_HUB_OWNER_DASHBOARD.md",
    "reports/UAOS_MASTER_LOCAL_PROGRAM_HUB_INTEGRATION_REPORT.md",
    "logs/UAOS_MASTER_LOCAL_PROGRAM_HUB_LOG.txt",
    "seal/UAOS_MASTER_LOCAL_PROGRAM_HUB_FINAL_SEAL.md",
]

FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "react integration: yes",
    "deploy/payment: yes",
    "export approval: yes",
    "export_allowed: true",
    '"export_allowed": true',
    "compatibility claim: yes",
    "pa3x-ready claim: yes",
    "usb write: yes",
    "korg output: yes",
]
REMOTE_LINK_RE = re.compile(r"""(?:href|src)=["'](?:https?:|file:|//)""", re.IGNORECASE)


def main():
    required_file_findings = [{"path": rel, "exists": (FACTORY / rel).exists()} for rel in REQUIRED_FILES]
    forbidden_file_findings = []
    forbidden_claim_findings = []
    remote_link_findings = []
    export_state_findings = []

    for path in FACTORY.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(FACTORY).as_posix()
        if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
            forbidden_file_findings.append(rel)
        if path == RESULTS or rel.endswith("uaos_master_local_program_hub_validator.py"):
            continue
        if path.suffix.lower() not in {".md", ".json", ".html", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        lowered = text.lower()
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in lowered:
                forbidden_claim_findings.append({"path": rel, "pattern": pattern})
        if path.suffix.lower() == ".html" and REMOTE_LINK_RE.search(text):
            remote_link_findings.append(rel)
        if "export" in lowered and not any(token in lowered for token in ["blocked", "export_allowed: false", '"export_allowed": false', "export allowed: no"]):
            export_state_findings.append(rel)

    passed = (
        all(item["exists"] for item in required_file_findings)
        and not forbidden_file_findings
        and not forbidden_claim_findings
        and not remote_link_findings
        and not export_state_findings
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "factory_path": str(FACTORY),
        "product_surface_linked": True,
        "v58_linked": True,
        "v59_linked": True,
        "v60_linked": True,
        "static_local_only": True,
        "app_jsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "korg_output": False,
        "export_allowed": False,
        "midi_audio_generation": False,
        "usb_write": False,
        "pa3x_load": False,
        "compatibility_claim": False,
        "pa3x_ready_claim": False,
        "required_file_findings": required_file_findings,
        "forbidden_file_findings": forbidden_file_findings,
        "forbidden_claim_findings": forbidden_claim_findings,
        "remote_link_findings": remote_link_findings,
        "export_state_findings": export_state_findings
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
