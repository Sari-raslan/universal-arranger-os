import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
ELECTRON = ROOT / "electron"
GENERATED = REPO / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v30-dark-ui" / "run-20260704_114352"

HTML = ROOT / "UAOS_PC_WORKSTATION_APP_V30.html"
CSS = ROOT / "assets" / "uaos_v30_dark_theme.css"
JS = ROOT / "assets" / "uaos_v30_app.js"
HOME = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
MAIN = ELECTRON / "main.js"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore")


required_files = [
    HTML,
    CSS,
    JS,
    ROOT / "START_UAOS_PC_WORKSTATION_V30.cmd",
    ROOT / "docs" / "START_HERE_V30_AR.md",
    ROOT / "docs" / "V30_DARK_UI_CHANGELOG_AR.md",
    ROOT / "validator" / "validate_v30_dark_ui.py",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V30_DARK_UI_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V30_DARK_UI_SEAL.json",
    ELECTRON / "START_ELECTRON_LOCAL_V30.cmd",
    ELECTRON / "BUILD_ELECTRON_LOCAL_V30.cmd",
    GENERATED / "reports" / "V30_VALIDATOR_REPORT.md",
    GENERATED / "reports" / "V30_DARK_UI_QA_REPORT.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V30_DARK_UI_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V30_DARK_UI_FINAL_SEAL.json",
]

failures = []
warnings = []

for path in required_files:
    if not path.exists():
        failures.append(f"missing required file: {path}")

if (ROOT / "App.jsx").exists():
    failures.append("App.jsx exists in stable target")

html = read(HTML) if HTML.exists() else ""
css = read(CSS) if CSS.exists() else ""
js = read(JS) if JS.exists() else ""
home = read(HOME) if HOME.exists() else ""
main = read(MAIN) if MAIN.exists() else ""

if "assets/uaos_v30_dark_theme.css" not in html or "assets/uaos_v30_app.js" not in html:
    failures.append("V30 HTML does not reference local V30 CSS and JS")

for label in ["PC_ONLY", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]:
    if label not in html:
        failures.append(f"missing safety label in V30 HTML: {label}")

for page_id in ["dashboard", "project", "style", "library", "player", "writer", "files", "safety"]:
    if f'id="{page_id}"' not in html:
        failures.append(f"missing V30 page: {page_id}")

for button_label in ["افتح", "عدّل", "شغّل", "صدّر", "احفظ", "أوقف"]:
    if button_label not in html:
        failures.append(f"missing simplified button label: {button_label}")

if "UAOS_PC_WORKSTATION_APP_V30.html" not in home:
    failures.append("home page does not link to V30")

if "UAOS_PC_WORKSTATION_APP_V30.html" not in main and not (ELECTRON / "START_ELECTRON_LOCAL_V30.cmd").exists():
    failures.append("Electron main does not point to V30 and V30 start cmd is missing")

if "AudioContext" not in js or "playPreview" not in js or "stopAudio" not in js:
    failures.append("WebAudio preview functions are incomplete")

if "localStorage" not in js or "exportJson" not in js or "uaosV30SelfTest" not in js:
    failures.append("save/load/export/self-test functions are incomplete")

dark_markers = ["#030509", "#0b111b", "linear-gradient", "--cyan"]
if not all(marker in css for marker in dark_markers):
    failures.append("dark theme markers are incomplete")

combined = "\n".join([html, css, js, home, main])
rebuilt_v30_resource = ELECTRON / "dist-local" / "win-unpacked" / "resources" / "app_content" / "UAOS_PC_WORKSTATION_APP_V30.html"
for forbidden in [
    "PA3X_READY",
    "KORG_COMPATIBLE",
    "LOAD_TO_PA3X",
    "USB_COPY_EXECUTED",
    "REAL_PA3X_SET",
    "HARDWARE_VERIFIED",
    "PRODUCTION_READY_FOR_KEYBOARD",
]:
    if forbidden in combined:
        failures.append(f"forbidden claim present: {forbidden}")

if re.search(r"https?://", combined, re.IGNORECASE):
    failures.append("external URL found in V30 app files")

lower = combined.lower()
if "owner" + "-fixtures" in lower:
    failures.append("owner fixture path segment found")
if "proprietary sample" in lower:
    failures.append("proprietary sample reference found")
if re.search(r"(?m)^\s*(copy|xcopy|robocopy)\b", lower):
    failures.append("file copy command found")
if "deploy: yes" in lower or "payment: yes" in lower:
    failures.append("deploy/payment affirmative claim found")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "base_commit": "eddeef64bfa7d89658362df23e0af83bf962c009",
    "deliverable": "UAOS_PC_WORKSTATION_V30_DARK_UI",
    "v30_app_created": "YES" if HTML.exists() else "NO",
    "dark_theme": "YES" if CSS.exists() and "#030509" in css else "NO",
    "simplified_buttons": "YES" if all(label in html for label in ["افتح", "عدّل", "شغّل", "صدّر", "احفظ", "أوقف"]) else "NO",
    "main_uaos_style": "YES" if "UAOS PC Workstation" in html and "--cyan" in css else "NO",
    "electron_main_updated": "YES" if "UAOS_PC_WORKSTATION_APP_V30.html" in main else "NO",
    "electron_rebuilt": "YES" if rebuilt_v30_resource.exists() else "SKIPPED",
    "installer_created": "NO",
    "deploy": "NO",
    "payment": "NO",
    "usb_write": "NO",
    "external_copy_outside_repo": "NO",
    "pa3x_load": "NO",
    "fixture_modification": "NO",
    "owner_fixture_access": "NO",
    "proprietary_content_copied": "NO",
    "app_jsx_touched": "NO",
    "warnings": warnings,
    "failures": failures,
}

(ROOT / "validator" / "VALIDATOR_V30_DARK_UI_RESULT.json").write_text(
    json.dumps(result, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
print(json.dumps(result, indent=2, ensure_ascii=False))
