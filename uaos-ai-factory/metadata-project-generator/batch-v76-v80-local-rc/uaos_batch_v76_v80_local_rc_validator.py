from __future__ import annotations

import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
REPO_ROOT = Path(__file__).resolve().parents[3]
BATCH = Path(__file__).resolve().parent
OUT = BATCH / "UAOS_BATCH_V76_V80_LOCAL_RC_VALIDATOR_RESULTS.json"

RESULTS = [
    BASE / "v76/generated/UAOS_V76_VALIDATOR_RESULTS.json",
    BASE / "v77/generated/UAOS_V77_VALIDATOR_RESULTS.json",
    BASE / "v78/generated/UAOS_V78_VALIDATOR_RESULTS.json",
    BASE / "v79/generated/UAOS_V79_VALIDATOR_RESULTS.json",
    BASE / "v80/generated/UAOS_V80_VALIDATOR_RESULTS.json",
]
MIDI = BASE / "v71/midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"
PACKAGE = BASE / "v72/package/UAOS_V72_PROJECT_PACKAGE.uaos.json"
ZIP = BASE / "v73/exports/UAOS_V73_GENERIC_STYLE_PACKAGE.zip"
PREVIEW = BASE / "v75/preview/UAOS_V75_LOCAL_EXPORT_PREVIEW.html"
OPEN_PAGE = BATCH / "UAOS_BATCH_V76_V80_LOCAL_RC_OPEN_HERE.html"
FORBIDDEN_EXT = {".set", ".sty", ".prf", ".prs", ".kst"}


def add(checks: list[dict], name: str, passed: bool, detail: str) -> None:
    checks.append({"name": name, "passed": bool(passed), "detail": detail})


def json_status(path: Path) -> str:
    if not path.exists():
        return "MISSING"
    return json.loads(path.read_text(encoding="utf-8")).get("status", "UNKNOWN")


def appjsx_changed() -> bool:
    proc = subprocess.run(["git", "-C", str(REPO_ROOT), "diff", "--name-only", "HEAD", "--"], capture_output=True, text=True, check=False)
    return any(line.replace("\\", "/").endswith("App.jsx") for line in proc.stdout.splitlines())


def forbidden_files() -> list[str]:
    roots = [BASE / name for name in ["v76", "v77", "v78", "v79", "v80", "batch-v76-v80-local-rc"]]
    hits = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in FORBIDDEN_EXT:
                hits.append(str(path.relative_to(BASE)))
    return hits


def scan_text() -> dict[str, list[str]]:
    patterns = {
        "usb_path": ["usb:\\", "\\usb\\", "copy to usb", "usb write: yes"],
        "pa3x_load": ["pa3x load: yes", "load to pa3x"],
        "react_integration": ["react integration: yes", "react-dom"],
        "deploy_payment": ["deploy: yes", "payment: yes"],
        "compatibility_claim": ["compatibility claim: yes", "compatible with pa3x"],
        "pa3x_ready_claim": ["pa3x-ready: yes", "pa3x ready: yes"],
    }
    hits: dict[str, list[str]] = {key: [] for key in patterns}
    for root in [BASE / name for name in ["v76", "v77", "v78", "v79", "v80", "batch-v76-v80-local-rc"]]:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() in {".py", ".zip", ".mid"}:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore").lower()
            for key, values in patterns.items():
                if any(pattern in text for pattern in values):
                    hits[key].append(str(path.relative_to(BASE)))
    return {key: value for key, value in hits.items() if value}


def main() -> int:
    checks: list[dict] = []
    for idx, path in enumerate(RESULTS, start=76):
        status = json_status(path)
        add(checks, f"V{idx} PASS", status == "PASS", status)

    midi_ok = MIDI.exists() and MIDI.read_bytes().startswith(b"MThd") and b"MTrk" in MIDI.read_bytes()
    add(checks, "V71 MIDI exists and valid", midi_ok, str(MIDI))

    package_ok = False
    if PACKAGE.exists():
        try:
            data = json.loads(PACKAGE.read_text(encoding="utf-8"))
            package_ok = all(key in data for key in ["uaos_package_version", "status", "export_status"])
        except json.JSONDecodeError:
            package_ok = False
    add(checks, "V72 UAOS package exists and valid", package_ok, str(PACKAGE))

    zip_ok = False
    if ZIP.exists():
        try:
            with zipfile.ZipFile(ZIP) as archive:
                zip_ok = len(archive.infolist()) > 0
        except zipfile.BadZipFile:
            zip_ok = False
    add(checks, "V73 ZIP exists and valid", zip_ok, str(ZIP))
    add(checks, "V75 preview exists", PREVIEW.exists(), str(PREVIEW))
    add(checks, "local RC open page exists", OPEN_PAGE.exists(), str(OPEN_PAGE))

    forbidden = forbidden_files()
    text_hits = scan_text()
    add(checks, "no .SET/.STY/.PRF/.PRS/.KST", not forbidden, ",".join(forbidden) or "none")
    add(checks, "no USB path, PA3X load, React, deploy/payment, or claims", not text_hits, json.dumps(text_hits, sort_keys=True))
    add(checks, "no App.jsx touched", not appjsx_changed(), "git diff HEAD")

    passed = all(item["passed"] for item in checks)
    OUT.write_text(json.dumps({"validator": "UAOS_BATCH_V76_V80_LOCAL_RC_VALIDATOR", "status": "PASS" if passed else "FAIL", "generated_at": datetime.now(timezone.utc).isoformat(), "checks": checks, "next_fastest_action": "Choose one V80 roadmap option"}, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
