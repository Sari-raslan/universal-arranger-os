import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "generated/UAOS_V66_EXTERNAL_REVIEWER_PACK.json",
    "review/UAOS_V66_EXTERNAL_REVIEWER_README.md",
    "review/UAOS_V66_TECHNICAL_REVIEW_CHECKLIST.md",
    "review/UAOS_V66_MUSIC_REVIEW_CHECKLIST.md",
    "review/UAOS_V66_OWNER_MESSAGE_DRAFT_AR.md",
    "review/UAOS_V66_OWNER_MESSAGE_DRAFT_EN.md",
    "reports/UAOS_V66_QA_REPORT.md",
    "dashboards/UAOS_V66_OWNER_DASHBOARD.html",
    "seal/UAOS_V66_FINAL_SEAL.md",
]
result = {
    "validator_result": "PASS" if all((ROOT / item).exists() for item in required) else "FAIL",
    "version": "V66",
    "metadata_only": True,
    "export_allowed": False,
    "real_owner_approval_applied": False,
}
print(json.dumps(result, indent=2))
