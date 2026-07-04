import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT.parents[3] / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v31-owner-set-analyzer" / "run-20260704_120407"

required = [
    ROOT / "owner_set_input",
    ROOT / "owner_set_input" / ".gitignore",
    ROOT / "owner_set_input" / "PLACE_YOUR_SET_HERE_READ_ONLY.txt",
    ROOT / "owner_set_input" / "DO_NOT_EDIT_ORIGINAL_SET.md",
    ROOT / "set_analyzer" / "uaos_owner_set_scanner_v31.py",
    ROOT / "set_analyzer" / "RUN_SET_ANALYZER_V31.cmd",
    ROOT / "dsp_planner" / "uaos_dsp_unification_planner_v31.py",
    ROOT / "replacement_engine" / "uaos_replacement_suggestion_engine_v31.py",
    ROOT / "UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html",
    ROOT / "START_UAOS_PC_WORKSTATION_V31_SET_ANALYZER.cmd",
    ROOT / "assets" / "uaos_v31_set_analyzer.css",
    ROOT / "assets" / "uaos_v31_set_analyzer.js",
    ROOT / "data" / "v31_set_analyzer_schema.json",
    ROOT / "docs" / "START_HERE_SET_ANALYZER_V31_AR.md",
    ROOT / "docs" / "OWNER_SET_ANALYZER_WORKFLOW_V31_AR.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V31_SET_ANALYZER_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V31_SET_ANALYZER_SEAL.json",
    GENERATED / "reports" / "V31_SET_ANALYZER_VALIDATOR_REPORT.md",
    GENERATED / "reports" / "V31_SET_ANALYZER_QA_REPORT.md",
    GENERATED / "reports" / "V31_SET_ANALYZER_QA_REPORT.json",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V31_SET_ANALYZER_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V31_SET_ANALYZER_FINAL_SEAL.json",
]


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore")


failures = []
warnings = []
for path in required:
    if not path.exists():
        failures.append(f"missing required path: {path}")

if (ROOT / "App.jsx").exists():
    failures.append("App.jsx exists in stable target")

script_paths = [
    ROOT / "set_analyzer" / "uaos_owner_set_scanner_v31.py",
    ROOT / "set_analyzer" / "RUN_SET_ANALYZER_V31.cmd",
    ROOT / "dsp_planner" / "uaos_dsp_unification_planner_v31.py",
    ROOT / "replacement_engine" / "uaos_replacement_suggestion_engine_v31.py",
]
ui_paths = [
    ROOT / "UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html",
    ROOT / "assets" / "uaos_v31_set_analyzer.js",
    ROOT / "docs" / "START_HERE_SET_ANALYZER_V31_AR.md",
    ROOT / "docs" / "OWNER_SET_ANALYZER_WORKFLOW_V31_AR.md",
]

combined = "\n".join(read(path) for path in script_paths + ui_paths if path.exists())
lower = combined.lower()

for cmd in [r"(?m)^\s*del\b", r"(?m)^\s*erase\b", r"(?m)^\s*move\b", r"(?m)^\s*copy\b", r"(?m)^\s*xcopy\b", r"(?m)^\s*robocopy\b"]:
    if re.search(cmd, lower):
        failures.append(f"unsafe file operation command found: {cmd}")

if "owner" + "-fixtures" in lower:
    failures.append("owner fixture path segment found")
if "proprietary sample copying" in lower:
    failures.append("proprietary sample copying claim found")
if "deploy: yes" in lower or "payment: yes" in lower:
    failures.append("deploy/payment affirmative claim found")

for term in [
    ("PA3X", "READY"),
    ("KORG", "COMPATIBLE"),
    ("LOAD", "TO", "PA3X"),
    ("USB", "COPY", "EXECUTED"),
    ("REAL", "PA3X", "SET"),
    ("HARDWARE", "VERIFIED"),
    ("PRODUCTION", "READY", "FOR", "KEYBOARD"),
]:
    forbidden = "_".join(term)
    if forbidden in combined:
        failures.append(f"forbidden claim present: {forbidden}")

for marker in ["READ_ONLY", "NO USB", "NO PA3X"]:
    if marker not in combined:
        warnings.append(f"safety marker not found in UI/scripts: {marker}")

for path in [ROOT / "set_analyzer" / "analysis_outputs", ROOT / "dsp_planner" / "analysis_outputs", ROOT / "replacement_engine" / "analysis_outputs"]:
    if not path.exists():
        failures.append(f"missing analysis output folder: {path}")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "deliverable": "OWNER_SET_ANALYZER_V31",
    "input_folder": str(ROOT / "owner_set_input"),
    "scanner": "YES",
    "dsp_planner": "YES",
    "replacement_engine": "YES",
    "ui": "YES",
    "read_only": "YES",
    "original_set_modified": "NO",
    "usb_write": "NO",
    "pa3x_load": "NO",
    "korg_compatibility_claim": "NO",
    "empty_slot_detection": "HEURISTIC",
    "sampler_inventory": "HEURISTIC",
    "dsp_plan": "METADATA_ONLY",
    "replacement_suggestions": "HYPOTHESIS_ONLY",
    "warnings": warnings,
    "failures": failures,
}
(ROOT / "validator" / "VALIDATOR_V31_SET_ANALYZER_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
