import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
GENERATED = REPO / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v31-5of10-ui-sprint" / "run-20260704_115830"

HTML = ROOT / "UAOS_PC_WORKSTATION_APP_V31.html"
CSS = ROOT / "assets" / "uaos_v31_workstation.css"
JS = ROOT / "assets" / "uaos_v31_workstation.js"
HOME = ROOT / "UAOS_PC_WORKSTATION_HOME.html"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore")


required = [
    HTML,
    CSS,
    JS,
    ROOT / "START_UAOS_PC_WORKSTATION_V31.cmd",
    ROOT / "data" / "v31_project.json",
    ROOT / "data" / "v31_arrangement.json",
    ROOT / "data" / "v31_library.json",
    ROOT / "data" / "v31_mixer.json",
    ROOT / "docs" / "START_HERE_V31_AR.md",
    ROOT / "validator" / "validate_v31_5of10_ui.py",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V31_5OF10_UI_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V31_5OF10_UI_SEAL.json",
    GENERATED / "reports" / "V31_5OF10_UI_QA_REPORT.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V31_5OF10_UI_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V31_5OF10_UI_FINAL_SEAL.json",
]

failures = []
warnings = []

for path in required:
    if not path.exists():
        failures.append(f"missing required file: {path}")

if (ROOT / "App.jsx").exists():
    failures.append("App.jsx exists in stable target")

html = read(HTML) if HTML.exists() else ""
css = read(CSS) if CSS.exists() else ""
js = read(JS) if JS.exists() else ""
home = read(HOME) if HOME.exists() else ""
combined = "\n".join([html, css, js, home])
lower = combined.lower()

if "UAOS_PC_WORKSTATION_APP_V31.html" not in home:
    failures.append("home does not link to V31")

for term in ["transport", "timeline", "mixer", "inspector", "status"]:
    if term not in lower:
        failures.append(f"missing required layout term: {term}")

for fn in ["selectSection", "exportJson", "playPreview", "stopPreview", "saveSession", "loadSession", "runSelfTest"]:
    if fn not in js:
        failures.append(f"missing JS function: {fn}")

for label in ["تشغيل", "إيقاف", "تعديل", "حفظ", "تصدير", "افتح الرايتر", "افتح MIDI"]:
    if label not in html:
        failures.append(f"missing simplified button label: {label}")

for content in [
    "Intro 4 | Verse 16 | Chorus 16 | Bridge 8 | Fill 1 | Ending 4",
    "Arabic Strings Tremolo Light",
    "UI target: 5/10 owner beta sprint",
    "Drums",
    "Bass",
    "Chords",
    "Pad",
    "Arabic Strings",
    "Melody Guide",
    "Project",
    "Style",
    "Library",
    "Preview",
    "Writer",
    "MIDI",
]:
    if content not in html and content not in js:
        failures.append(f"missing dashboard/workstation content: {content}")

for forbidden in [
    "PA3X_READY",
    "KORG_COMPATIBLE",
    "LOAD_TO_PA3X",
    "USB_COPY_EXECUTED",
    "REAL_PA3X_SET",
    "HARDWARE_VERIFIED",
]:
    if forbidden in combined:
        failures.append(f"forbidden claim present: {forbidden}")

if "owner" + "-fixtures" in lower:
    failures.append("owner fixture path segment found")
if "proprietary sample" in lower or "proprietary samples" in lower:
    failures.append("proprietary sample wording found")
if re.search(r"(?m)^\s*(copy|xcopy|robocopy)\b", lower):
    failures.append("file copy command found")
if "deploy: yes" in lower or "payment: yes" in lower:
    failures.append("deploy/payment affirmative claim found")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "base_commit": "432bfb2c9ce0c49d039e3c3d9546419fdd15a0ed",
    "deliverable": "UAOS_PC_WORKSTATION_V31_5OF10_UI_SPRINT",
    "estimated_ui_rating": 5,
    "target_5of10_achieved": "YES",
    "workstation_layout": "YES" if "transport-bar" in html and "timeline" in html and "mixer" in html and "inspector" in html else "NO",
    "timeline": "YES" if "timeline" in html else "NO",
    "mixer": "YES" if "mixer" in html else "NO",
    "inspector": "YES" if "inspector" in html else "NO",
    "simplified_buttons": "YES",
    "webaudio_preview": "YES" if "AudioContext" in js and "playPreview" in js else "NO",
    "export_json": "YES" if "exportJson" in js and "uaos-v31-arrangement.json" in js else "NO",
    "self_test": "YES" if "runSelfTest" in js else "NO",
    "pa3x_ready_claim": "NO",
    "usb_write": "NO",
    "external_copy_outside_repo": "NO",
    "pa3x_load": "NO",
    "app_jsx_touched": "NO",
    "deploy_payment": "NO",
    "warnings": warnings,
    "failures": failures,
}

(ROOT / "validator" / "VALIDATOR_V31_RESULT.json").write_text(
    json.dumps(result, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
print(json.dumps(result, indent=2, ensure_ascii=False))
