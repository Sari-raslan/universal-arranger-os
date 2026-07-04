from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

V77 = Path(__file__).resolve().parents[1]
OUT = V77 / "generated" / "UAOS_V77_VALIDATOR_RESULTS.json"
HTML = V77 / "program" / "UAOS_V77_LOCAL_PROGRAM_RC_DASHBOARD.html"
REQUIRED_TEXT = ["Real MIDI Export", "CREATED", "UAOS Project Package", "Generic ZIP Package", "Export Validator", "PASS", "Local Preview", "READY", "KORG Export", "BLOCKED", "USB Write", "PA3X Load", "App.jsx", "NOT TOUCHED", "Deploy"]


def main() -> int:
    text = HTML.read_text(encoding="utf-8") if HTML.exists() else ""
    low = text.lower()
    checks = [
        {"name": "dashboard exists", "passed": HTML.exists(), "detail": str(HTML)},
        {"name": "required status cards", "passed": all(term in text for term in REQUIRED_TEXT), "detail": "status cards"},
        {"name": "static only", "passed": "<script" not in low and "react-dom" not in low, "detail": "no script/react"},
    ]
    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_V77_LOCAL_PROGRAM_RC_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
