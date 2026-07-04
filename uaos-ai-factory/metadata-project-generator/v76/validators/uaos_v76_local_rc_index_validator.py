from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
V76 = Path(__file__).resolve().parents[1]
OUT = V76 / "generated" / "UAOS_V76_VALIDATOR_RESULTS.json"

REQUIRED = [
    BASE / "v71/midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid",
    BASE / "v72/package/UAOS_V72_PROJECT_PACKAGE.uaos.json",
    BASE / "v73/exports/UAOS_V73_GENERIC_STYLE_PACKAGE.zip",
    BASE / "v74/generated/UAOS_V74_HARDENED_EXPORT_VALIDATOR_RESULTS.json",
    BASE / "v75/preview/UAOS_V75_LOCAL_EXPORT_PREVIEW.html",
    V76 / "generated/UAOS_V76_LOCAL_RC_PACKAGE_INDEX.json",
    V76 / "rc/UAOS_V76_LOCAL_RC_OPEN_HERE.html",
]


def main() -> int:
    checks = [{"name": path.name, "passed": path.exists(), "detail": str(path)} for path in REQUIRED]
    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_V76_LOCAL_RC_INDEX_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
