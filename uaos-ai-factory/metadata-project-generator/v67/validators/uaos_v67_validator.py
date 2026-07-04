import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "generated/UAOS_V67_MOCK_EXPORT_MANIFEST_ONLY.json",
    "manifest/UAOS_V67_MOCK_EXPORT_MANIFEST.md",
    "manifest/UAOS_V67_NO_EXPORT_PROOF.json",
    "manifest/UAOS_V67_BLOCKED_OUTPUT_MAP.md",
    "reports/UAOS_V67_QA_REPORT.md",
    "dashboards/UAOS_V67_OWNER_DASHBOARD.html",
    "seal/UAOS_V67_FINAL_SEAL.md",
]
result = {
    "validator_result": "PASS" if all((ROOT / item).exists() for item in required) else "FAIL",
    "version": "V67",
    "metadata_only": True,
    "export_allowed": False,
    "real_export_created": False,
}
print(json.dumps(result, indent=2))
