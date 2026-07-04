import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "generated/UAOS_V68_SAFETY_GATE_HARDENING_RESULTS.json",
    "safety/UAOS_V68_FORBIDDEN_OUTPUT_POLICY_HARDENED.md",
    "safety/UAOS_V68_FORBIDDEN_CLAIM_POLICY_HARDENED.json",
    "safety/UAOS_V68_OWNER_APPROVAL_GATE_HARDENED.md",
    "safety/UAOS_V68_NO_EXPORT_POLICY_HARDENED.md",
    "reports/UAOS_V68_QA_REPORT.md",
    "dashboards/UAOS_V68_OWNER_DASHBOARD.html",
    "seal/UAOS_V68_FINAL_SEAL.md",
]
result = {
    "validator_result": "PASS" if all((ROOT / item).exists() for item in required) else "FAIL",
    "version": "V68",
    "metadata_only": True,
    "export_allowed": False,
    "source_mutation_allowed": False,
}
print(json.dumps(result, indent=2))
