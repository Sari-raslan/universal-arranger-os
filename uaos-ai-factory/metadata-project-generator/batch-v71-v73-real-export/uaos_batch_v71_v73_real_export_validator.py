import json
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
BATCH = BASE / "batch-v71-v73-real-export"
RESULTS = BATCH / "UAOS_BATCH_V71_V73_REAL_EXPORT_VALIDATOR_RESULTS.json"
V71_MIDI = BASE / "v71" / "midi" / "UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"
V72_PKG = BASE / "v72" / "package" / "UAOS_V72_PROJECT_PACKAGE.uaos.json"
V73_ZIP = BASE / "v73" / "exports" / "UAOS_V73_GENERIC_STYLE_PACKAGE.zip"
FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".wav", ".mp3", ".exe", ".msi"}
ALLOWED_BINARY = {V71_MIDI.resolve(), V73_ZIP.resolve()}
SCAN_DIRS = [BASE / "v71", BASE / "v72", BASE / "v73", BATCH]


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    v71 = read_json(BASE / "v71" / "generated" / "UAOS_V71_VALIDATOR_RESULTS.json")
    v72 = read_json(BASE / "v72" / "generated" / "UAOS_V72_VALIDATOR_RESULTS.json")
    v73 = read_json(BASE / "v73" / "generated" / "UAOS_V73_VALIDATOR_RESULTS.json")
    midi = V71_MIDI.read_bytes() if V71_MIDI.exists() else b""
    forbidden_files = []
    forbidden_claims = []
    for folder in SCAN_DIRS:
        for path in folder.rglob("*"):
            if not path.is_file():
                continue
            resolved = path.resolve()
            rel = path.relative_to(BASE).as_posix()
            suffix = path.suffix.lower()
            if suffix in FORBIDDEN_EXTENSIONS or (suffix == ".mid" and resolved != V71_MIDI.resolve()) or (suffix == ".zip" and resolved != V73_ZIP.resolve()):
                forbidden_files.append(rel)
            if path.suffix.lower() not in {".md", ".json", ".html", ".txt", ".py"}:
                continue
            if path.name.endswith("_validator.py") or path == RESULTS:
                continue
            text = path.read_text(encoding="utf-8", errors="replace").lower()
            for phrase in ["compatibility_claim: true", '"compatibility_claim": true', "pa3x_ready: true", '"pa3x_ready": true', "korg_output: true", '"korg_output": true', "usb_write: true", '"usb_write": true', "appjsx_touched: true", '"appjsx_touched": true']:
                if phrase in text:
                    forbidden_claims.append({"path": rel, "phrase": phrase})
    zip_entries = []
    zip_ok = False
    if V73_ZIP.exists():
        with zipfile.ZipFile(V73_ZIP) as zf:
            zip_entries = zf.namelist()
            zip_ok = any(name.endswith(".mid") for name in zip_entries) and any(name.endswith(".uaos.json") for name in zip_entries)
    passed = (
        v71.get("validator_result") == "PASS"
        and v72.get("validator_result") == "PASS"
        and v73.get("validator_result") == "PASS"
        and V71_MIDI.exists()
        and midi.startswith(b"MThd")
        and b"MTrk" in midi
        and V72_PKG.exists()
        and V73_ZIP.exists()
        and zip_ok
        and not forbidden_files
        and not forbidden_claims
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "v71_pass": v71.get("validator_result") == "PASS",
        "v72_pass": v72.get("validator_result") == "PASS",
        "v73_pass": v73.get("validator_result") == "PASS",
        "midi_exists": V71_MIDI.exists(),
        "midi_has_mthd": midi.startswith(b"MThd"),
        "midi_has_mtrk": b"MTrk" in midi,
        "uaos_package_exists": V72_PKG.exists(),
        "zip_exists": V73_ZIP.exists(),
        "zip_entries": zip_entries,
        "zip_valid": zip_ok,
        "korg_output": False,
        "usb_write": False,
        "pa3x_load": False,
        "appjsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "compatibility_claim": False,
        "pa3x_ready": False,
        "forbidden_files": forbidden_files,
        "forbidden_claims": forbidden_claims
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
