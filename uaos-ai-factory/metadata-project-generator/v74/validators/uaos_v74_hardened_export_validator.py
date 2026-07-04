from __future__ import annotations

import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path


V74_DIR = Path(__file__).resolve().parents[1]
BASE_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = Path(__file__).resolve().parents[4]

MIDI_PATH = BASE_DIR / "v71" / "midi" / "UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"
PACKAGE_PATH = BASE_DIR / "v72" / "package" / "UAOS_V72_PROJECT_PACKAGE.uaos.json"
ZIP_PATH = BASE_DIR / "v73" / "exports" / "UAOS_V73_GENERIC_STYLE_PACKAGE.zip"
RESULTS_PATH = V74_DIR / "generated" / "UAOS_V74_HARDENED_EXPORT_VALIDATOR_RESULTS.json"
INTEGRITY_PATH = V74_DIR / "generated" / "UAOS_V74_EXPORT_ARTIFACT_INTEGRITY_REPORT.json"

REQUIRED_PACKAGE_FIELDS = [
    "uaos_package_version",
    "status",
    "style_intent_metadata",
    "section_plan_metadata",
    "arrangement_role_metadata",
    "owner_decision_status",
    "export_status",
    "v71_midi_reference",
    "korg_output",
    "pa3x_ready",
    "compatibility_claim",
    "usb_write",
    "appjsx_touched",
    "deploy",
    "payment",
]

ZIP_ALLOWED_EXTENSIONS = {".mid", ".json", ".md", ".txt", ".html"}
FORBIDDEN_FILE_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".wav", ".mp3"}
TEXT_SCAN_DIRS = [
    BASE_DIR / "v71",
    BASE_DIR / "v72",
    BASE_DIR / "v73",
    BASE_DIR / "batch-v71-v73-real-export",
    V74_DIR,
]


def add_check(checks: list[dict], name: str, passed: bool, detail: str) -> None:
    checks.append({"name": name, "passed": bool(passed), "detail": detail})


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def git_changed_appjsx() -> list[str]:
    try:
        proc = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "diff", "--name-only", "HEAD", "--"],
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return ["git unavailable"]
    return [line for line in proc.stdout.splitlines() if line.replace("\\", "/").endswith("App.jsx")]


def find_forbidden_local_files() -> list[str]:
    hits: list[str] = []
    for folder in TEXT_SCAN_DIRS:
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if path.is_file() and path.suffix.lower() in FORBIDDEN_FILE_EXTENSIONS:
                hits.append(str(path.relative_to(BASE_DIR)))
    return hits


def find_forbidden_text() -> dict[str, list[str]]:
    patterns = {
        "usb_path": ["usb:\\", "/usb/", "\\usb\\", "copy to usb", "usb write: yes", "usb_write\": true"],
        "pa3x_load": ["pa3x load: yes", "load to pa3x", "pa3x_load\": true"],
        "korg_writer": ["korg writer: yes", "korg_writer\": true", "korg file writer"],
        "pa3x_ready_claim": ["pa3x-ready: yes", "pa3x ready: yes", "pa3x_ready\": true"],
        "compatibility_claim": ["compatibility claim: yes", "compatibility_claim\": true", "compatible with pa3x"],
        "react_integration": ["react integration: yes", "react_integration\": true"],
        "deploy_payment": ["deploy: yes", "deploy\": true", "payment: yes", "payment\": true"],
    }
    hits: dict[str, list[str]] = {key: [] for key in patterns}
    for folder in TEXT_SCAN_DIRS:
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if not path.is_file() or path.suffix.lower() in {".py", ".mid", ".zip"}:
                continue
            lowered = read_text(path).lower()
            for key, values in patterns.items():
                if any(pattern in lowered for pattern in values):
                    hits[key].append(str(path.relative_to(BASE_DIR)))
    return {key: value for key, value in hits.items() if value}


def main() -> int:
    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    checks: list[dict] = []
    integrity: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "artifacts": {},
        "zip_entries": [],
    }

    midi_ok = False
    if MIDI_PATH.exists():
        data = MIDI_PATH.read_bytes()
        midi_ok = data.startswith(b"MThd") and b"MTrk" in data
        integrity["artifacts"]["v71_midi"] = {
            "path": str(MIDI_PATH),
            "bytes": len(data),
            "starts_mthd": data.startswith(b"MThd"),
            "contains_mtrk": b"MTrk" in data,
        }
    add_check(checks, "V71 MIDI exists and is SMF", midi_ok, str(MIDI_PATH))

    package_ok = False
    package_fields_ok = False
    if PACKAGE_PATH.exists():
        try:
            package_data = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
            package_ok = True
            missing = [field for field in REQUIRED_PACKAGE_FIELDS if field not in package_data]
            package_fields_ok = not missing
            integrity["artifacts"]["v72_package"] = {
                "path": str(PACKAGE_PATH),
                "bytes": PACKAGE_PATH.stat().st_size,
                "missing_required_fields": missing,
            }
        except json.JSONDecodeError as exc:
            integrity["artifacts"]["v72_package"] = {"path": str(PACKAGE_PATH), "json_error": str(exc)}
    add_check(checks, "V72 UAOS package JSON parses", package_ok, str(PACKAGE_PATH))
    add_check(checks, "V72 UAOS package required fields exist", package_fields_ok, ",".join(REQUIRED_PACKAGE_FIELDS))

    zip_ok = False
    zip_extensions_ok = False
    zip_forbidden = []
    if ZIP_PATH.exists():
        try:
            with zipfile.ZipFile(ZIP_PATH) as archive:
                bad_ext = []
                entries = []
                for info in archive.infolist():
                    if info.is_dir():
                        continue
                    suffix = Path(info.filename).suffix.lower()
                    entries.append({"name": info.filename, "bytes": info.file_size, "extension": suffix})
                    if suffix not in ZIP_ALLOWED_EXTENSIONS:
                        bad_ext.append(info.filename)
                    if suffix in FORBIDDEN_FILE_EXTENSIONS:
                        zip_forbidden.append(info.filename)
                integrity["zip_entries"] = entries
                zip_extensions_ok = not bad_ext
                zip_ok = True
        except zipfile.BadZipFile as exc:
            integrity["artifacts"]["v73_zip"] = {"path": str(ZIP_PATH), "zip_error": str(exc)}
    add_check(checks, "V73 ZIP opens", zip_ok, str(ZIP_PATH))
    add_check(checks, "V73 ZIP contains only approved extensions", zip_extensions_ok, ",".join(sorted(ZIP_ALLOWED_EXTENSIONS)))
    add_check(checks, "V73 ZIP contains no KORG or audio file extensions", not zip_forbidden, ",".join(zip_forbidden) or "none")

    forbidden_local_files = find_forbidden_local_files()
    forbidden_text = find_forbidden_text()
    appjsx_changes = git_changed_appjsx()
    add_check(checks, "No forbidden KORG or audio local files", not forbidden_local_files, ",".join(forbidden_local_files) or "none")
    add_check(checks, "No USB path, PA3X load, KORG writer, or approval claims", not forbidden_text, json.dumps(forbidden_text, sort_keys=True))
    add_check(checks, "No App.jsx touched", not appjsx_changes, ",".join(appjsx_changes) or "none")

    passed = all(check["passed"] for check in checks)
    result = {
        "validator": "UAOS_V74_HARDENED_EXPORT_VALIDATOR",
        "status": "PASS" if passed else "FAIL",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "checked_artifacts": {
            "v71_midi": str(MIDI_PATH),
            "v72_package": str(PACKAGE_PATH),
            "v73_zip": str(ZIP_PATH),
        },
        "export_states": {
            "korg_export": "BLOCKED",
            "usb_write": "BLOCKED",
            "pa3x_load": "BLOCKED",
            "deploy": "BLOCKED",
            "payment": "BLOCKED",
        },
        "checks": checks,
    }
    RESULTS_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    integrity["status"] = result["status"]
    INTEGRITY_PATH.write_text(json.dumps(integrity, indent=2) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
