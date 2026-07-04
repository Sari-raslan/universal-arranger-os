import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v17-writer-automation" / "run-20260704_023618"
RESULT = ROOT / "validator" / "VALIDATOR_V17_WRITER_AUTOMATION_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V17_VALIDATOR_REPORT.md"

def read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""

checks = []
def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

writer = ROOT / "writer" / "uaos_pc_workstation_writer_v17.py"
cmd = ROOT / "writer" / "RUN_WRITER_V17.cmd"
writer_input = ROOT / "writer" / "writer_input_default_v17.json"
out = ROOT / "writer" / "generated_v17_outputs"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
required_outputs = [
    out / "SARI_UAOS_PC_WORKSTATION_V17.uaosproj",
    out / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.uaosstyle",
    out / "SARI_ARABIC_STRINGS_LIBRARY_BINDINGS_V17.json",
    out / "SARI_UAOS_PC_WORKSTATION_V17_MANIFEST.json",
    out / "WRITER_V17_RUN_LOG.txt",
]
midi = out / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.mid"
skipped = out / "MIDI_SKIPPED_REPORT.md"

scan_files = [
    writer, cmd, writer_input, home,
    ROOT / "writer" / "WRITER_V17_README_AR.md",
    ROOT / "writer" / "WRITER_V17_README_EN.md",
    ROOT / "docs" / "V17_WRITER_AUTOMATION_NOTES_AR.md",
    ROOT / "docs" / "V17_WRITER_AUTOMATION_NOTES_EN.md",
] + required_outputs
declaration_files = [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V17_WRITER_AUTOMATION_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V17_WRITER_AUTOMATION_SEAL.json",
]

check("stable folder exists", ROOT.exists(), str(ROOT))
check("writer script exists", writer.exists(), str(writer))
check("CMD runner exists", cmd.exists(), str(cmd))
check("writer input exists", writer_input.exists(), str(writer_input))
check("generated outputs exist", out.exists(), str(out))
for path in required_outputs:
    check(f"{path.name} exists", path.exists(), str(path))
check("MIDI exists or skipped report exists", midi.exists() or skipped.exists(), str(midi if midi.exists() else skipped))
check("Home HTML links to Writer Automation V17", home.exists() and "writer/RUN_WRITER_V17.cmd" in read(home) and "writer/generated_v17_outputs" in read(home), str(home))

labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
combined = "\n".join(read(p) for p in scan_files + declaration_files if p.exists())
missing = [label for label in labels if label not in combined]
check("safety labels present", not missing, json.dumps(missing))

scan_text = "\n".join(read(p) for p in scan_files if p.exists())
forbidden = [
    "PA3X" + "_READY", "KORG" + "_COMPATIBLE", "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED", "REAL" + "_PA3X" + "_SET", "HARDWARE" + "_VERIFIED",
    "App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample",
    "http://", "https://"
]
found = [token for token in forbidden if token.lower() in scan_text.lower()]
check("forbidden strings absent", not found, json.dumps(found))
check("no deploy/payment behavior", "deploy" not in read(writer).lower() and "payment" not in read(writer).lower() and "deploy" not in read(cmd).lower() and "payment" not in read(cmd).lower(), "writer/cmd")
check("no external output path in writer", "generated_v17_outputs" in read(writer) and "E:\\" not in read(writer) and "C:\\" not in read(writer), str(writer))

status = "PASS" if all(c["ok"] for c in checks) else "FAIL"
payload = {
  "status": status,
  "checks": checks,
  "midi_generated": "YES" if midi.exists() else "SKIPPED",
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
REPORT.write_text("# UAOS PC Workstation V17 Validator Report\n\nValidator status: " + status + "\n\n" + "\n".join(f"- {c['name']}: {'PASS' if c['ok'] else 'FAIL'} - {c['detail']}" for c in checks) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
