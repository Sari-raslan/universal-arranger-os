from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


BATCH_DIR = Path(__file__).resolve().parent
BASE_DIR = BATCH_DIR.parent
RESULTS_PATH = BATCH_DIR / "UAOS_BATCH_V74_V75_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    BASE_DIR / "v74" / "generated" / "UAOS_V74_HARDENED_EXPORT_VALIDATOR_RESULTS.json",
    BASE_DIR / "v75" / "generated" / "UAOS_V75_VALIDATOR_RESULTS.json",
    BATCH_DIR / "UAOS_BATCH_V74_V75_OWNER_DASHBOARD.html",
    BATCH_DIR / "UAOS_BATCH_V74_V75_EXECUTIVE_SUMMARY.md",
    BATCH_DIR / "UAOS_BATCH_V74_V75_QA_REPORT.md",
    BATCH_DIR / "UAOS_BATCH_V74_V75_FINAL_SEAL.md",
]


def main() -> int:
    checks = []
    for path in REQUIRED_FILES:
        checks.append({"name": f"exists:{path.name}", "passed": path.exists(), "detail": str(path)})

    for path in REQUIRED_FILES[:2]:
        status = "MISSING"
        if path.exists():
            status = json.loads(path.read_text(encoding="utf-8")).get("status", "UNKNOWN")
        checks.append({"name": f"pass:{path.name}", "passed": status == "PASS", "detail": status})

    safety_text = " ".join(path.read_text(encoding="utf-8", errors="ignore").lower() for path in REQUIRED_FILES if path.exists())
    checks.append({"name": "blocked safety states present", "passed": all(term in safety_text for term in ["korg", "blocked", "usb", "pa3x", "app.jsx", "deploy"]), "detail": "safety labels"})
    checks.append({"name": "no forbidden approval text", "passed": "korg writer: yes" not in safety_text and "usb write: yes" not in safety_text and "pa3x load: yes" not in safety_text, "detail": "approval absent"})

    passed = all(check["passed"] for check in checks)
    result = {
        "validator": "UAOS_BATCH_V74_V75_VALIDATOR",
        "status": "PASS" if passed else "FAIL",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
        "next_action": "V76-V80 Local Program RC Export Trial",
    }
    RESULTS_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
