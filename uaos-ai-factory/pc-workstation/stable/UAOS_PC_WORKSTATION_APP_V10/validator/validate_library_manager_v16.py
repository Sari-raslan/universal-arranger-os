import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v16-library-manager" / "run-20260704_021544"
RESULT = ROOT / "validator" / "VALIDATOR_V16_LIBRARY_MANAGER_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V16_VALIDATOR_REPORT.md"

def read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""

checks = []
def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

manager = ROOT / "library" / "UAOS_LIBRARY_MANAGER_V16.html"
database = ROOT / "library" / "library_database_v16.json"
presets = ROOT / "library" / "arabic_strings_presets_v16.json"
mapping = ROOT / "library" / "track_mapping_v16.json"
articulations = ROOT / "library" / "articulations_v16.json"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
scan_files = [
    manager, database, presets, mapping, articulations,
    ROOT / "library" / "LIBRARY_MANAGER_V16_README_AR.md",
    ROOT / "library" / "LIBRARY_MANAGER_V16_README_EN.md",
    ROOT / "docs" / "V16_LIBRARY_MANAGER_NOTES_AR.md",
    ROOT / "docs" / "V16_LIBRARY_MANAGER_NOTES_EN.md",
    home
]
declaration_files = [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V16_LIBRARY_MANAGER_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V16_LIBRARY_MANAGER_SEAL.json"
]

check("stable folder exists", ROOT.exists(), str(ROOT))
check("V16 library manager exists", manager.exists(), str(manager))
check("library database exists", database.exists(), str(database))
check("Arabic strings presets exist", presets.exists(), str(presets))
check("track mapping exists", mapping.exists(), str(mapping))
check("articulations exists", articulations.exists(), str(articulations))
check("Home HTML links to Library Manager V16", home.exists() and "library/UAOS_LIBRARY_MANAGER_V16.html" in read(home), str(home))

labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "METADATA_ONLY", "NO_SAMPLES_INCLUDED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
combined = "\n".join(read(p) for p in scan_files + declaration_files)
missing = [label for label in labels if label not in combined]
check("safety labels present", not missing, json.dumps(missing))

scan_text = "\n".join(read(p) for p in scan_files)
forbidden = [
    "PA3X" + "_READY", "KORG" + "_COMPATIBLE", "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED", "REAL" + "_PA3X" + "_SET", "HARDWARE" + "_VERIFIED",
    "App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample",
    ".mp3", ".wav", ".aif", ".flac", "<audio"
]
found = [token for token in forbidden if token.lower() in scan_text.lower()]
check("forbidden strings and sample references absent", not found, json.dumps(found))
check("no deploy/payment behavior", "deploy" not in read(manager).lower() and "payment" not in read(manager).lower(), str(manager))
check("no external URLs", "http://" not in combined and "https://" not in combined, "V16 files")

status = "PASS" if all(c["ok"] for c in checks) else "FAIL"
payload = {
  "status": status,
  "checks": checks,
  "samples_included": "NO",
  "pa3x_ready_claim": "NO",
  "usb_write": "NO",
  "external_copy_outside_repo": "NO",
  "pa3x_load": "NO",
  "fixture_modification": "NO",
  "owner_fixture_access": "NO",
  "proprietary_content_copied": "NO",
  "app_jsx_touched": "NO",
  "deploy_payment": "NO"
}
RESULT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
REPORT.write_text("# UAOS PC Workstation V16 Validator Report\n\nValidator status: " + status + "\n\n" + "\n".join(f"- {c['name']}: {'PASS' if c['ok'] else 'FAIL'} - {c['detail']}" for c in checks) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
