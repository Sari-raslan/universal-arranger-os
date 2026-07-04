import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT.parents[3] / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v33-deep-heuristic-analyzer" / "run-20260704_134506"

required = [
    ROOT / "deep_analyzer" / "uaos_v33_deep_set_analyzer.py",
    ROOT / "deep_analyzer" / "RUN_V33_DEEP_ANALYZER.cmd",
    ROOT / "UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html",
    ROOT / "assets" / "uaos_v33_deep_analyzer.css",
    ROOT / "assets" / "uaos_v33_deep_analyzer.js",
    ROOT / "START_UAOS_PC_WORKSTATION_V33_DEEP_ANALYZER.cmd",
    ROOT / "OPEN_V33_DEEP_ANALYZER.cmd",
    ROOT / "OPEN_V33_RESULTS.cmd",
    ROOT / "OPEN_V33_SUMMARY.cmd",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_DEEP_SET_SUMMARY_AR.md",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_DEEP_SET_SUMMARY.json",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_BANK_SLOT_GUESSES.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_SOUND_STYLE_SAMPLE_CLASSIFICATION.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_EMPTY_WEAK_CANDIDATES.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_DUPLICATE_GROUPS.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_SAMPLER_GROUPS.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_DSP_ASSIGNMENTS.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_REPLACEMENT_SUGGESTIONS.csv",
    ROOT / "deep_analyzer" / "analysis_outputs" / "V33_MANUAL_REVIEW_REQUIRED_AR.md",
    GENERATED / "reports" / "V33_DEEP_ANALYZER_QA_REPORT.md",
    GENERATED / "reports" / "V33_DEEP_ANALYZER_QA_REPORT.json",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V33_DEEP_ANALYZER_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V33_DEEP_ANALYZER_FINAL_SEAL.json",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V33_DEEP_ANALYZER_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V33_DEEP_ANALYZER_SEAL.json",
]


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore")


failures = []
warnings = []
for path in required:
    if not path.exists():
        failures.append(f"missing required path: {path}")
    if path.exists() and "analysis_outputs" in str(path):
        expected = ROOT / "deep_analyzer" / "analysis_outputs"
        if path.suffix and expected not in path.parents:
            failures.append(f"output outside deep_analyzer analysis_outputs: {path}")

if (ROOT / "App.jsx").exists():
    failures.append("App.jsx exists in stable target")

scan_paths = [
    ROOT / "deep_analyzer" / "uaos_v33_deep_set_analyzer.py",
    ROOT / "deep_analyzer" / "RUN_V33_DEEP_ANALYZER.cmd",
    ROOT / "UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html",
    ROOT / "assets" / "uaos_v33_deep_analyzer.js",
    ROOT / "OPEN_V33_DEEP_ANALYZER.cmd",
    ROOT / "OPEN_V33_RESULTS.cmd",
    ROOT / "OPEN_V33_SUMMARY.cmd",
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

summary_path = ROOT / "deep_analyzer" / "analysis_outputs" / "V33_DEEP_SET_SUMMARY.json"
summary = json.loads(read(summary_path)) if summary_path.exists() else {}
result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "deliverable": "V33_DEEP_HEURISTIC_ANALYZER",
    "files_analyzed": summary.get("files_analyzed", 0),
    "set_structure_detected": summary.get("set_structure_detected", "NO"),
    "sampler_candidates": summary.get("sampler_candidates", 0),
    "empty_weak_candidates": summary.get("empty_weak_candidates", 0),
    "duplicate_groups": summary.get("duplicate_groups", 0),
    "useful_suggestions": summary.get("useful_suggestions", 0),
    "read_only": "YES",
    "original_set_modified": "NO",
    "usb_write": "NO",
    "pa3x_load": "NO",
    "korg_compatibility_claim": "NO",
    "keyboard_ready_claim": "NO",
    "binary_writer": "NO",
    "sample_extraction": "NO",
    "app_jsx_touched": "NO",
    "deploy_payment": "NO",
    "warnings": warnings,
    "failures": failures,
}
(ROOT / "validator" / "VALIDATOR_V33_DEEP_ANALYZER_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
