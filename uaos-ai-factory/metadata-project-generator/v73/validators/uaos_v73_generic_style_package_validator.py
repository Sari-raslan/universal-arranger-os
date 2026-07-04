import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "exports" / "UAOS_V73_GENERIC_STYLE_PACKAGE.zip"
allowed = {".json", ".md", ".mid"}
forbidden = {".set", ".sty", ".prf", ".prs", ".kst", ".wav", ".mp3", ".exe", ".msi"}
names = []
bad = []
has_mid = False
has_uaos = False
if ZIP.exists():
    with zipfile.ZipFile(ZIP) as zf:
        names = zf.namelist()
        for name in names:
            suffix = Path(name).suffix.lower()
            if suffix not in allowed or suffix in forbidden:
                bad.append(name)
            if name.endswith("UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"):
                has_mid = True
            if name.endswith("UAOS_V72_PROJECT_PACKAGE.uaos.json"):
                has_uaos = True
passed = ZIP.exists() and has_mid and has_uaos and not bad
result = {
    "validator_result": "PASS" if passed else "FAIL",
    "version": "V73",
    "zip_exists": ZIP.exists(),
    "zip_entries": names,
    "contains_v71_midi": has_mid,
    "contains_v72_uaos_json": has_uaos,
    "disallowed_entries": bad,
    "korg_output": False,
    "compatibility_claim": False,
    "pa3x_ready": False
}
(ROOT / "generated" / "UAOS_V73_VALIDATOR_RESULTS.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if result["validator_result"] == "PASS" else 1)
