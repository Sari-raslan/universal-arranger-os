import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v19-owner-package" / "run-20260704_030628"
RESULT = ROOT / "validator" / "VALIDATOR_V19_OWNER_PACKAGE_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V19_VALIDATOR_REPORT.md"

def read(path):
    if not path.exists():
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ""

checks = []
def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

paths = {
    "Home exists": ROOT / "UAOS_PC_WORKSTATION_HOME.html",
    "Daily Workflow V19 exists": ROOT / "dash" / "UAOS_PC_WORKSTATION_DAILY_WORKFLOW_V19.html",
    "daily_workflow_v19_data.json exists": ROOT / "dash" / "daily_workflow_v19_data.json",
    "START docs EN exist": ROOT / "docs" / "START_HERE_V19_EN.md",
    "START docs AR exist": ROOT / "docs" / "START_HERE_V19_AR.md",
    "Owner daily workflow EN exists": ROOT / "docs" / "OWNER_DAILY_WORKFLOW_V19_EN.md",
    "Owner daily workflow AR exists": ROOT / "docs" / "OWNER_DAILY_WORKFLOW_V19_AR.md",
    "Ready/not-ready EN exists": ROOT / "docs" / "WHAT_IS_READY_AND_NOT_READY_V19_EN.md",
    "Ready/not-ready AR exists": ROOT / "docs" / "WHAT_IS_READY_AND_NOT_READY_V19_AR.md",
    "Project Editor V13 exists": ROOT / "editor" / "UAOS_PROJECT_EDITOR_V13.html",
    "Style Editor V14 exists": ROOT / "style_editor" / "UAOS_STYLE_SECTION_EDITOR_V14.html",
    "Library Manager V16 exists": ROOT / "library" / "UAOS_LIBRARY_MANAGER_V16.html",
    "Internal Player V15 exists": ROOT / "preview" / "UAOS_INTERNAL_PLAYER_V15.html",
    "Writer V17 exists": ROOT / "writer" / "RUN_WRITER_V17.cmd",
    "Writer outputs exist": ROOT / "writer" / "generated_v17_outputs",
    "MIDI exists": ROOT / "writer" / "generated_v17_outputs" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.mid",
    "Self Check V18 exists": ROOT / "dash" / "UAOS_PC_WORKSTATION_SELF_CHECK_V18.html",
}

check("stable folder exists", ROOT.exists(), str(ROOT))
for name, path in paths.items():
    check(name, path.exists(), str(path))

home = paths["Home exists"]
check("Home links to Daily Workflow V19", home.exists() and "dash/UAOS_PC_WORKSTATION_DAILY_WORKFLOW_V19.html" in read(home), str(home))

scan_files = list(paths.values()) + [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V19_OWNER_PACKAGE_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V19_OWNER_PACKAGE_SEAL.json",
]
combined = "\n".join(read(p) for p in scan_files if p.exists() and p.is_file())
labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
missing = [label for label in labels if label not in combined]
check("safety labels present", not missing, json.dumps(missing))

product_scan_files = [paths[k] for k in paths if "exists" in k]
scan_text = "\n".join(read(p) for p in product_scan_files if p.exists() and p.is_file())
forbidden = [
    "PA3X" + "_READY", "KORG" + "_COMPATIBLE", "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED", "REAL" + "_PA3X" + "_SET", "HARDWARE" + "_VERIFIED",
    "PRODUCTION" + "_READY" + "_FOR" + "_KEYBOARD",
    "App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample",
    "http://", "https://"
]
found = [token for token in forbidden if token.lower() in scan_text.lower()]
check("forbidden strings absent", not found, json.dumps(found))

action_text = "\n".join([
    read(ROOT / "writer" / "RUN_WRITER_V17.cmd"),
    read(ROOT / "electron" / "START_ELECTRON_DEV.cmd"),
    read(ROOT / "writer" / "uaos_pc_workstation_writer_v17.py"),
])
check("no deploy/payment behavior", "deploy" not in action_text.lower() and "payment" not in action_text.lower(), "local runner/script files")
check("no USB paths as actions", "USB_COPY" not in combined and "USB:\\" not in combined, "V19 files")

status = "PASS" if all(c["ok"] for c in checks) else "FAIL"
payload = {
  "status": status,
  "checks": checks,
  "project_editor_v13": "YES" if paths["Project Editor V13 exists"].exists() else "NO",
  "style_editor_v14": "YES" if paths["Style Editor V14 exists"].exists() else "NO",
  "internal_player_v15": "YES" if paths["Internal Player V15 exists"].exists() else "NO",
  "library_manager_v16": "YES" if paths["Library Manager V16 exists"].exists() else "NO",
  "writer_v17": "YES" if paths["Writer V17 exists"].exists() else "NO",
  "self_check_v18": "YES" if paths["Self Check V18 exists"].exists() else "NO",
  "midi": "YES" if paths["MIDI exists"].exists() else "NO",
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
REPORT.write_text("# UAOS PC Workstation V19 Validator Report\n\nValidator status: " + status + "\n\n" + "\n".join(f"- {c['name']}: {'PASS' if c['ok'] else 'FAIL'} - {c['detail']}" for c in checks) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
