import json
from datetime import datetime, timezone
from pathlib import Path


FACTORY = Path(__file__).resolve().parents[1]
RESULTS = FACTORY / "validators" / "UAOS_AGENT_PREWRITER_FACTORY_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    "agents/AGENT_A_OWNER_DECISION_PREWRITER.md",
    "agents/AGENT_B_STYLE_PLANNING_PREWRITER.md",
    "agents/AGENT_C_EXPORT_RESEARCH_PREWRITER.md",
    "agents/AGENT_D_VALIDATOR_PREWRITER.md",
    "agents/AGENT_E_DASHBOARD_QA_PREWRITER.md",
    "agents/AGENT_F_FINAL_SEAL_PREWRITER.md",
    "draft-queue/UAOS_V62_DRAFT_PLAN.md",
    "draft-queue/UAOS_V63_DRAFT_PLAN.md",
    "draft-queue/UAOS_V64_DRAFT_PLAN.md",
    "draft-queue/UAOS_V65_DRAFT_PLAN.md",
    "draft-queue/UAOS_V66_DRAFT_PLAN.md",
    "draft-queue/UAOS_V67_DRAFT_PLAN.md",
    "draft-queue/UAOS_V68_DRAFT_PLAN.md",
    "draft-queue/UAOS_V69_DRAFT_PLAN.md",
    "draft-queue/UAOS_V70_DRAFT_PLAN.md",
    "draft-queue/UAOS_V62_TO_V70_DRAFT_QUEUE_INDEX.json",
    "draft-queue/UAOS_V62_TO_V70_EXECUTION_ORDER.md",
    "validators/uaos_agent_prewriter_factory_validator.py",
    "validators/UAOS_AGENT_PREWRITER_FACTORY_VALIDATION_RULES.md",
    "dashboards/UAOS_AGENT_PREWRITER_FACTORY_DASHBOARD.html",
    "reports/UAOS_AGENT_PREWRITER_FACTORY_QA_REPORT.md",
    "reports/UAOS_AGENT_PREWRITER_FACTORY_OWNER_DASHBOARD.md",
    "seal/UAOS_AGENT_PREWRITER_FACTORY_FINAL_SEAL.md",
    "logs/UAOS_AGENT_PREWRITER_FACTORY_LOG.txt",
]

FORBIDDEN_EXTENSIONS = {
    ".set",
    ".sty",
    ".prf",
    ".prs",
    ".kst",
    ".mid",
    ".midi",
    ".wav",
    ".mp3",
    ".aiff",
    ".flac",
}

FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_CLAIMS = [
    "real_owner_approval_applied: " + "true",
    '"real_owner_approval_applied": ' + "true",
    "export_allowed: " + "true",
    '"export_allowed": ' + "true",
    "pass_claim_allowed: " + "true",
    '"pass_claim_allowed": ' + "true",
    "PA3X" + "-ready",
    "compatibility_claim: " + "true",
    '"compatibility_claim": ' + "true",
    "export " + "approved",
    "deploy " + "enabled",
    "payment " + "enabled",
]


def read_text(path):
    return path.read_text(encoding="utf-8", errors="replace")


def main():
    required_file_findings = [
        {"path": rel, "exists": (FACTORY / rel).exists()} for rel in REQUIRED_FILES
    ]

    forbidden_file_findings = []
    forbidden_claim_findings = []
    safety_flag_findings = []

    for path in FACTORY.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(FACTORY).as_posix()
        if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
            forbidden_file_findings.append(rel)
        if path == RESULTS:
            continue
        if path.suffix.lower() not in {".md", ".json", ".html", ".txt", ".py"}:
            continue
        text = read_text(path)
        for claim in FORBIDDEN_CLAIMS:
            if claim.lower() in text.lower():
                forbidden_claim_findings.append({"path": rel, "claim": claim})
        if rel.startswith("draft-queue/UAOS_V") and rel.endswith("_DRAFT_PLAN.md"):
            missing = []
            for required in [
                'future_version_status: "DRAFT_NOT_RUN"',
                "real_owner_approval_applied: false",
                "export_allowed: false",
                "pass_claim_allowed: false",
            ]:
                if required not in text:
                    missing.append(required)
            if missing:
                safety_flag_findings.append({"path": rel, "missing": missing})

    passed = (
        all(item["exists"] for item in required_file_findings)
        and not forbidden_file_findings
        and not forbidden_claim_findings
        and not safety_flag_findings
    )

    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "factory_path": str(FACTORY),
        "metadata_only": True,
        "draft_only": True,
        "future_versions_executed": False,
        "future_versions_marked_pass": False,
        "export_allowed": False,
        "korg_output": False,
        "app_jsx_touched": False,
        "deploy_payment": False,
        "required_file_findings": required_file_findings,
        "forbidden_file_findings": forbidden_file_findings,
        "forbidden_claim_findings": forbidden_claim_findings,
        "safety_flag_findings": safety_flag_findings,
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
