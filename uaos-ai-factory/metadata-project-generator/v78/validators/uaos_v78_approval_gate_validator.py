from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

V78 = Path(__file__).resolve().parents[1]
OUT = V78 / "generated" / "UAOS_V78_VALIDATOR_RESULTS.json"
GATE = V78 / "approval" / "UAOS_V78_NEXT_EXPORT_APPROVAL_GATE.json"


def main() -> int:
    data = json.loads(GATE.read_text(encoding="utf-8")) if GATE.exists() else {}
    checks = [
        {"name": "approval gate exists", "passed": GATE.exists(), "detail": str(GATE)},
        {"name": "no approval applied", "passed": data.get("approval_applied_in_this_run") is False, "detail": str(data.get("approval_applied_in_this_run"))},
        {"name": "blocked states retained", "passed": all(data.get("blocked", {}).get(key) is True for key in ["korg_writer", "usb_write", "pa3x_load", "appjsx", "deploy"]), "detail": "blocked"},
    ]
    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_V78_APPROVAL_GATE_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
