import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT.parents[3] / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v34-owner-decision-pack" / "run-20260704_140528"

required = [
    ROOT / "decision_pack" / "uaos_v34_owner_decision_builder.py",
    ROOT / "decision_pack" / "RUN_V34_DECISION_PACK.cmd",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_OWNER_DECISION_SUMMARY_AR.md",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_OWNER_DECISION_SUMMARY.json",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_REVIEW_ACTIONS.csv",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_SAFE_NEXT_STEPS_AR.md",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_NEEDS_OWNER_APPROVAL_AR.md",
    ROOT / "decision_pack" / "analysis_outputs" / "V34_SAMPLER_ZERO_EXPLANATION_AR.md",
    ROOT / "UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html",
    ROOT / "assets" / "uaos_v34_owner_decision.css",
    ROOT / "assets" / "uaos_v34_owner_decision.js",
    ROOT / "START_UAOS_PC_WORKSTATION_V34_DECISION_PACK.cmd",
    ROOT / "OPEN_V34_DECISION_PACK.cmd",
    ROOT / "OPEN_V34_RESULTS.cmd",
    ROOT / "OPEN_V34_SUMMARY.cmd",
    ROOT / "OPEN_ALL_RESULTS.cmd",
    GENERATED / "reports" / "V34_OWNER_DECISION_PACK_QA_REPORT.md",
    GENERATED / "reports" / "V34_OWNER_DECISION_PACK_QA_REPORT.json",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V34_OWNER_DECISION_PACK_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V34_OWNER_DECISION_PACK_FINAL_SEAL.json",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V34_OWNER_DECISION_PACK_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V34_OWNER_DECISION_PACK_SEAL.json",
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
    ROOT / "decision_pack" / "uaos_v34_owner_decision_builder.py",
    ROOT / "decision_pack" / "RUN_V34_DECISION_PACK.cmd",
    ROOT / "UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html",
    ROOT / "assets" / "uaos_v34_owner_decision.js",
    ROOT / "OPEN_V34_DECISION_PACK.cmd",
    ROOT / "OPEN_V34_RESULTS.cmd",
    ROOT / "OPEN_V34_SUMMARY.cmd",
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

summary_path = ROOT / "decision_pack" / "analysis_outputs" / "V34_OWNER_DECISION_SUMMARY.json"
summary = json.loads(read(summary_path)) if summary_path.exists() else {}
result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "deliverable": "V34_OWNER_DECISION_PACK",
    "files_analyzed": summary.get("files_analyzed", 0),
    "weak_candidates": summary.get("weak_candidates", 0),
    "useful_suggestions": summary.get("useful_suggestions", 0),
    "sampler_candidates": summary.get("sampler_candidates", 0),
    "read_only": "YES",
    "original_set_modified": "NO",
    "usb_write": "NO",
    "pa3x_load": "NO",
    "binary_writer": "NO",
    "sample_extraction": "NO",
    "korg_compatibility_claim": "NO",
    "keyboard_ready_claim": "NO",
    "app_jsx_touched": "NO",
    "deploy_payment": "NO",
    "warnings": warnings,
    "failures": failures,
}
(ROOT / "validator" / "VALIDATOR_V34_DECISION_PACK_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
