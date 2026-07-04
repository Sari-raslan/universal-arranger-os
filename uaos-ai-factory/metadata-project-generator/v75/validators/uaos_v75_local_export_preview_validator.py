from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


V75_DIR = Path(__file__).resolve().parents[1]
BASE_DIR = Path(__file__).resolve().parents[2]
PREVIEW_PATH = V75_DIR / "preview" / "UAOS_V75_LOCAL_EXPORT_PREVIEW.html"
RESULTS_PATH = V75_DIR / "generated" / "UAOS_V75_VALIDATOR_RESULTS.json"

REQUIRED_LINKS = [
    "../../v71/midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid",
    "../../v72/package/UAOS_V72_PROJECT_PACKAGE.uaos.json",
    "../../v73/exports/UAOS_V73_GENERIC_STYLE_PACKAGE.zip",
    "../../v74/generated/UAOS_V74_EXPORT_ARTIFACT_INTEGRITY_REPORT.json",
    "../../batch-v74-v75-export-preview/UAOS_BATCH_V74_V75_OWNER_DASHBOARD.html",
]

REQUIRED_STATUSES = [
    "Real MIDI Export",
    "CREATED",
    "UAOS Project Package",
    "Generic ZIP Package",
    "KORG Export",
    "BLOCKED",
    "USB Write",
    "PA3X Load",
    "App.jsx",
    "NOT TOUCHED",
    "Deploy",
]


def add_check(checks: list[dict], name: str, passed: bool, detail: str) -> None:
    checks.append({"name": name, "passed": bool(passed), "detail": detail})


def main() -> int:
    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    checks: list[dict] = []
    text = PREVIEW_PATH.read_text(encoding="utf-8") if PREVIEW_PATH.exists() else ""
    lowered = text.lower()

    add_check(checks, "Preview HTML exists", PREVIEW_PATH.exists(), str(PREVIEW_PATH))
    add_check(checks, "Static HTML has no script tag", "<script" not in lowered, "no script")
    add_check(checks, "No React integration", "react integration: yes" not in lowered and "react-dom" not in lowered, "react blocked")
    add_check(checks, "No server dependency", "localhost" not in lowered and "http://" not in lowered and "https://" not in lowered, "local relative links only")
    add_check(checks, "Required artifact links present", all(link in text for link in REQUIRED_LINKS), json.dumps(REQUIRED_LINKS))
    add_check(checks, "Required status cards present", all(status in text for status in REQUIRED_STATUSES), json.dumps(REQUIRED_STATUSES))
    add_check(checks, "Generic-only safety phrase present", "Generic MIDI/UAOS export only" in text and "not KORG/PA3X ready" in text, "generic only")
    add_check(checks, "No KORG writer or USB path", "korg writer: yes" not in lowered and "usb:\\" not in lowered and "\\usb\\" not in lowered, "blocked")

    passed = all(check["passed"] for check in checks)
    result = {
        "validator": "UAOS_V75_LOCAL_EXPORT_PREVIEW_VALIDATOR",
        "status": "PASS" if passed else "FAIL",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "preview": str(PREVIEW_PATH),
        "checks": checks,
        "export_states": {
            "korg_export": "BLOCKED",
            "usb_write": "BLOCKED",
            "pa3x_load": "BLOCKED",
            "deploy": "BLOCKED",
            "appjsx": "NOT_TOUCHED",
        },
    }
    RESULTS_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
