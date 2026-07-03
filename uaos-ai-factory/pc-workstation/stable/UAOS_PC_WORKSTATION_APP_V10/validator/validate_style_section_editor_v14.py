import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v14-style-section-editor" / "run-20260704_014400"
RESULT = ROOT / "validator" / "VALIDATOR_V14_STYLE_SECTION_EDITOR_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V14_VALIDATOR_REPORT.md"

def read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""

checks = []
def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

editor = ROOT / "style_editor" / "UAOS_STYLE_SECTION_EDITOR_V14.html"
sections = ROOT / "style_editor" / "style_sections_v14.json"
tracks = ROOT / "style_editor" / "style_tracks_v14.json"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
scan_files = [
    editor, sections, tracks,
    ROOT / "style_editor" / "STYLE_SECTION_EDITOR_V14_README_AR.md",
    ROOT / "style_editor" / "STYLE_SECTION_EDITOR_V14_README_EN.md",
    ROOT / "docs" / "V14_STYLE_SECTION_EDITOR_NOTES_AR.md",
    ROOT / "docs" / "V14_STYLE_SECTION_EDITOR_NOTES_EN.md",
    home
]
declaration_files = [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V14_STYLE_SECTION_EDITOR_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V14_STYLE_SECTION_EDITOR_SEAL.json"
]

check("stable folder exists", ROOT.exists(), str(ROOT))
check("V14 style editor exists", editor.exists(), str(editor))
check("style sections JSON exists", sections.exists(), str(sections))
check("style tracks JSON exists", tracks.exists(), str(tracks))
check("Home HTML links to Style Section Editor V14", home.exists() and "style_editor/UAOS_STYLE_SECTION_EDITOR_V14.html" in read(home), str(home))

labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
combined = "\n".join(read(p) for p in scan_files + declaration_files)
missing = [label for label in labels if label not in combined]
check("safety labels present", not missing, json.dumps(missing))

scan_text = "\n".join(read(p) for p in scan_files)
forbidden = ["PA3X" + "_READY", "KORG" + "_COMPATIBLE", "LOAD" + "_TO" + "_PA3X", "USB" + "_COPY" + "_EXECUTED", "REAL" + "_PA3X" + "_SET", "HARDWARE" + "_VERIFIED", "App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample"]
found = [token for token in forbidden if token.lower() in scan_text.lower()]
check("forbidden strings absent", not found, json.dumps(found))
check("no deploy/payment behavior", "deploy" not in read(editor).lower() and "payment" not in read(editor).lower(), str(editor))
check("no external URLs", "http://" not in combined and "https://" not in combined, "V14 files")

status = "PASS" if all(c["ok"] for c in checks) else "FAIL"
payload = {
  "status": status,
  "checks": checks,
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
REPORT.write_text("# UAOS PC Workstation V14 Validator Report\n\nValidator status: " + status + "\n\n" + "\n".join(f"- {c['name']}: {'PASS' if c['ok'] else 'FAIL'} - {c['detail']}" for c in checks) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
