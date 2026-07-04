import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "generated/UAOS_V70_PHASE_SUMMARY_APPROVAL_GATE.json",
    "summary/UAOS_V70_V58_TO_V70_PHASE_SUMMARY.md",
    "summary/UAOS_V70_NEXT_APPROVAL_GATE.md",
    "summary/UAOS_V70_OWNER_DECISION_REQUIRED.md",
    "summary/UAOS_V70_NEXT_SAFE_BATCH_PLAN_V71_V75.md",
    "reports/UAOS_V70_QA_REPORT.md",
    "dashboards/UAOS_V70_OWNER_DASHBOARD.html",
    "seal/UAOS_V70_FINAL_SEAL.md",
]
result = {
    "validator_result": "PASS" if all((ROOT / item).exists() for item in required) else "FAIL",
    "version": "V70",
    "metadata_only": True,
    "export_allowed": False,
    "real_owner_approval_applied": False,
}
print(json.dumps(result, indent=2))
