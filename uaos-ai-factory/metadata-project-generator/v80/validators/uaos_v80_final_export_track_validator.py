from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

V80 = Path(__file__).resolve().parents[1]
OUT = V80 / "generated" / "UAOS_V80_VALIDATOR_RESULTS.json"
SUMMARY = V80 / "summary" / "UAOS_V80_FINAL_SAFE_EXPORT_TRACK_SUMMARY.md"
REQUIRED = ["V71 real MIDI created", "V72 UAOS package created", "V73 Generic ZIP created", "V74 hardened validator PASS", "V75 local preview READY", "V76-V80 local RC ready", "KORG still blocked"]


def main() -> int:
    text = SUMMARY.read_text(encoding="utf-8") if SUMMARY.exists() else ""
    checks = [
        {"name": "summary exists", "passed": SUMMARY.exists(), "detail": str(SUMMARY)},
        {"name": "required summary points", "passed": all(item in text for item in REQUIRED), "detail": "summary"},
    ]
    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_V80_FINAL_EXPORT_TRACK_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
