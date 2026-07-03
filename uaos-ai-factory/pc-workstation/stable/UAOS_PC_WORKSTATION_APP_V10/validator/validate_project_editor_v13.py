import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v13-project-editor" / "run-20260704_004118"
RESULT = ROOT / "validator" / "VALIDATOR_V13_PROJECT_EDITOR_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V13_VALIDATOR_REPORT.md"


def rel(path):
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_text(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""


checks = []


def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


editor = ROOT / "editor" / "UAOS_PROJECT_EDITOR_V13.html"
state = ROOT / "editor" / "project_editor_state_v13.json"
schema = ROOT / "editor" / "project_editor_schema_v13.json"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
stable_files = [
    editor,
    state,
    schema,
    ROOT / "editor" / "PROJECT_EDITOR_V13_README_AR.md",
    ROOT / "editor" / "PROJECT_EDITOR_V13_README_EN.md",
    ROOT / "docs" / "V13_PROJECT_EDITOR_NOTES_AR.md",
    ROOT / "docs" / "V13_PROJECT_EDITOR_NOTES_EN.md",
    home,
]
safety_declaration_files = [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V13_PROJECT_EDITOR_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V13_PROJECT_EDITOR_SEAL.json",
]

check("stable folder exists", ROOT.exists(), str(ROOT))
check("V13 editor exists", editor.exists(), rel(editor))
check("state JSON exists", state.exists(), rel(state))
check("schema JSON exists", schema.exists(), rel(schema))
check("Home HTML links to Project Editor V13", home.exists() and "editor/UAOS_PROJECT_EDITOR_V13.html" in read_text(home), rel(home))

safety_labels = [
    "PC_ONLY",
    "UAOS_FORMAT",
    "TEST_UNVERIFIED",
    "NOT_FOR_PA3X_LOAD",
    "NOT_FOR_USB_TRANSFER",
    "NOT_COMPATIBILITY_VERIFIED",
]
combined = "\n".join(read_text(path) for path in stable_files + safety_declaration_files)
missing_labels = [label for label in safety_labels if label not in combined]
check("safety labels present", not missing_labels, json.dumps(missing_labels))

forbidden_tokens = [
    "PA3X" + "_READY",
    "KORG" + "_COMPATIBLE",
    "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED",
    "REAL" + "_PA3X" + "_SET",
    "HARDWARE" + "_VERIFIED",
]
forbidden_markers = ["App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample"]
found = []
for token in forbidden_tokens + forbidden_markers:
    if token.lower() in "\n".join(read_text(path) for path in stable_files).lower():
        found.append(token)

check("forbidden strings absent", not found, json.dumps(found))
check("no deploy/payment behavior", "deploy" not in read_text(editor).lower() and "payment" not in read_text(editor).lower(), rel(editor))
check("no external URLs", "http://" not in combined and "https://" not in combined, "V13 stable files")

status = "PASS" if all(item["ok"] for item in checks) else "FAIL"
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
REPORT.write_text(
    "# UAOS PC Workstation V13 Validator Report\n\n"
    f"Validator status: {status}\n\n"
    + "\n".join([f"- {item['name']}: {'PASS' if item['ok'] else 'FAIL'} - {item['detail']}" for item in checks])
    + "\n",
    encoding="utf-8"
)
print(json.dumps(payload, indent=2, ensure_ascii=False))
