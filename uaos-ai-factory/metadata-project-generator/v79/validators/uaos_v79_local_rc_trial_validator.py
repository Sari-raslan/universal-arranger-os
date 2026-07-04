from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

V79 = Path(__file__).resolve().parents[1]
OUT = V79 / "generated" / "UAOS_V79_VALIDATOR_RESULTS.json"
STEPS = V79 / "trial" / "UAOS_V79_OWNER_TEST_STEPS.md"
REQUIRED_STEPS = ["Open V77 local RC dashboard", "Open V75 export preview", "Locate V71 MIDI", "Open/import MIDI in DAW", "Inspect V72 UAOS package JSON", "Inspect V73 Generic ZIP", "Confirm KORG export remains blocked"]


def main() -> int:
    text = STEPS.read_text(encoding="utf-8") if STEPS.exists() else ""
    checks = [
        {"name": "owner test steps exist", "passed": STEPS.exists(), "detail": str(STEPS)},
        {"name": "required steps present", "passed": all(step in text for step in REQUIRED_STEPS), "detail": "steps"},
    ]
    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_V79_LOCAL_RC_TRIAL_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
