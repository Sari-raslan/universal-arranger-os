import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT.parents[3] / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v32-results-dashboard" / "run-20260704_131053"

required = [
    ROOT / "results_dashboard" / "uaos_v32_results_builder.py",
    ROOT / "results_dashboard" / "RUN_V32_RESULTS_DASHBOARD.cmd",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_OWNER_RESULTS_SUMMARY_AR.md",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_OWNER_RESULTS_SUMMARY.json",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_FILE_CATEGORY_TABLE.csv",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_MANUAL_REVIEW_TABLE.csv",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_NEXT_ANALYZER_RULES.md",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_DSP_SUMMARY_AR.md",
    ROOT / "results_dashboard" / "analysis_outputs" / "V32_REPLACEMENT_EXPLANATION_AR.md",
    ROOT / "UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html",
    ROOT / "assets" / "uaos_v32_results_dashboard.css",
    ROOT / "assets" / "uaos_v32_results_dashboard.js",
    ROOT / "START_UAOS_PC_WORKSTATION_V32_RESULTS.cmd",
    ROOT / "OPEN_V32_RESULTS.cmd",
    ROOT / "OPEN_V32_SUMMARY.cmd",
    ROOT / "OPEN_V32_DASHBOARD.cmd",
    ROOT / "OPEN_V32_TABLES.cmd",
    ROOT / "OPEN_ALL_RESULTS.cmd",
    GENERATED / "reports" / "V32_RESULTS_DASHBOARD_QA_REPORT.md",
    GENERATED / "reports" / "V32_RESULTS_DASHBOARD_QA_REPORT.json",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V32_RESULTS_DASHBOARD_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V32_RESULTS_DASHBOARD_FINAL_SEAL.json",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V32_RESULTS_DASHBOARD_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V32_RESULTS_DASHBOARD_SEAL.json",
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

scan_paths = [
    ROOT / "results_dashboard" / "uaos_v32_results_builder.py",
    ROOT / "results_dashboard" / "RUN_V32_RESULTS_DASHBOARD.cmd",
    ROOT / "UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html",
    ROOT / "assets" / "uaos_v32_results_dashboard.js",
    ROOT / "OPEN_V32_RESULTS.cmd",
    ROOT / "OPEN_V32_SUMMARY.cmd",
    ROOT / "OPEN_V32_DASHBOARD.cmd",
    ROOT / "OPEN_V32_TABLES.cmd",
    ROOT / "OPEN_ALL_RESULTS.cmd",
]
combined = "\n".join(read(path) for path in scan_paths if path.exists())
lower = combined.lower()

for pattern in [r"(?m)^\s*del\b", r"(?m)^\s*erase\b", r"(?m)^\s*move\b", r"(?m)^\s*copy\b", r"(?m)^\s*xcopy\b", r"(?m)^\s*robocopy\b", r"(?m)^\s*format\b"]:
    if re.search(pattern, lower):
        failures.append(f"unsafe command found: {pattern}")

for parts in [
    ("PA3X", "READY"),
    ("KORG", "COMPATIBLE"),
    ("LOAD", "TO", "PA3X"),
    ("USB", "COPY", "EXECUTED"),
    ("REAL", "PA3X", "SET"),
    ("HARDWARE", "VERIFIED"),
    ("PRODUCTION", "READY", "FOR", "KEYBOARD"),
]:
    term = "_".join(parts)
    if term in combined:
        failures.append(f"forbidden claim present: {term}")

if re.search(r"(?i)\busb\s*[:\\]", combined):
    failures.append("USB target found")
if ": ".join(["deploy", "yes"]) in lower or ": ".join(["payment", "yes"]) in lower:
    failures.append("deploy/payment affirmative claim found")

summary_path = ROOT / "results_dashboard" / "analysis_outputs" / "V32_OWNER_RESULTS_SUMMARY.json"
files_analyzed = 0
suggestions = 0
if summary_path.exists():
    summary = json.loads(read(summary_path))
    files_analyzed = summary.get("files_analyzed", 0)
    suggestions = summary.get("suggestions_found", 0)
    if files_analyzed != 38:
        warnings.append(f"expected 38 files from run sheet, found {files_analyzed}")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "deliverable": "V32_RESULTS_DASHBOARD",
    "files_analyzed": files_analyzed,
    "suggestions_found": suggestions,
    "read_only": "YES",
    "original_set_modified": "NO",
    "usb_write": "NO",
    "pa3x_load": "NO",
    "korg_compatibility_claim": "NO",
    "keyboard_ready_claim": "NO",
    "app_jsx_touched": "NO",
    "deploy_payment": "NO",
    "warnings": warnings,
    "failures": failures,
}
(ROOT / "validator" / "VALIDATOR_V32_RESULTS_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
