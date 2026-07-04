import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "confirmed_recommendations" / "analysis_outputs"
RESULT = Path(__file__).resolve().parent / "VALIDATOR_V36_CONFIRMED_RECOMMENDATIONS_RESULT.json"

REQUIRED = [
    ROOT / "confirmed_recommendations" / "uaos_v36_confirmed_recommendation_engine.py",
    ROOT / "confirmed_recommendations" / "RUN_V36_CONFIRMED_RECOMMENDATIONS.cmd",
    ROOT / "UAOS_PC_WORKSTATION_APP_V36_CONFIRMED_RECOMMENDATIONS.html",
    ROOT / "assets" / "uaos_v36_confirmed_recommendations.css",
    ROOT / "assets" / "uaos_v36_confirmed_recommendations.js",
    ROOT / "OPEN_V36_RECOMMENDATIONS.cmd",
    ROOT / "OPEN_V36_RESULTS.cmd",
    ROOT / "OPEN_V36_SUMMARY.cmd",
    ROOT / "START_UAOS_PC_WORKSTATION_V36_CONFIRMED_RECOMMENDATIONS.cmd",
    OUT / "V36_CONFIRMED_RECOMMENDATION_SUMMARY_AR.md",
    OUT / "V36_CONFIRMED_RECOMMENDATION_SUMMARY.json",
    OUT / "V36_CONFIRMED_ACTION_PLAN.csv",
    OUT / "V36_DSP_ACTION_PLAN.csv",
    OUT / "V36_STYLE_REVIEW_PLAN.csv",
    OUT / "V36_WEAK_ITEM_PLAN.csv",
    OUT / "V36_SAMPLER_UNKNOWN_PLAN_AR.md",
    OUT / "V36_NEXT_PRODUCT_STEP_AR.md",
]

OPENER_FILES = [
    ROOT / "OPEN_V36_RECOMMENDATIONS.cmd",
    ROOT / "OPEN_V36_RESULTS.cmd",
    ROOT / "OPEN_V36_SUMMARY.cmd",
    ROOT / "START_UAOS_PC_WORKSTATION_V36_CONFIRMED_RECOMMENDATIONS.cmd",
    ROOT / "OPEN_ALL_RESULTS.cmd",
]

FORBIDDEN_COMMANDS = ["del", "erase", "move", "copy", "xcopy", "robocopy", "format"]
FORBIDDEN_TOKENS = [
    "load_to_" + "pa3x",
    "usb_" + "copy" + "_executed",
    "real_" + "pa3x" + "_set",
    "hardware_" + "verified",
    "production_ready_for_" + "keyboard",
    "pa3x" + "_ready",
    "korg" + "_compatible",
    "deploy:" + " yes",
    "payment:" + " yes",
]


def read_text(path):
    return path.read_text(encoding="utf-8", errors="replace")


def check_text(path):
    errors = []
    text = read_text(path)
    low = text.lower()
    for command in FORBIDDEN_COMMANDS:
        if re.search(r"(?im)^\s*" + re.escape(command) + r"\b", text):
            errors.append(f"{path.name}: forbidden command {command}")
    usb_target_pattern = r"(?i)(^|[\s\"'])" + "usb" + r":\\"
    if re.search(usb_target_pattern, text):
        errors.append(f"{path.name}: USB drive target")
    if re.search(r"(?i)\bload\b.*\bpa3x\b|\bpa3x\b.*\bload\b", text):
        errors.append(f"{path.name}: PA3X load action")
    for token in FORBIDDEN_TOKENS:
        if token in low:
            errors.append(f"{path.name}: forbidden token {token}")
    return errors


def main():
    errors = []
    warnings = []
    for path in REQUIRED:
        if not path.exists():
            errors.append(f"missing: {path}")
    for path in OPENER_FILES:
        if not path.exists():
            errors.append(f"missing opener: {path}")
        else:
            errors.extend(check_text(path))

    open_all = ROOT / "OPEN_ALL_RESULTS.cmd"
    if open_all.exists():
        text = read_text(open_all)
        if "UAOS_PC_WORKSTATION_APP_V36_CONFIRMED_RECOMMENDATIONS.html" not in text:
            errors.append("OPEN_ALL_RESULTS missing V36 dashboard")
        if "confirmed_recommendations\\analysis_outputs" not in text:
            errors.append("OPEN_ALL_RESULTS missing V36 outputs")

    summary_path = OUT / "V36_CONFIRMED_RECOMMENDATION_SUMMARY.json"
    status = "UNKNOWN"
    counts = {}
    if summary_path.exists():
        summary = json.loads(read_text(summary_path))
        status = summary.get("status", "UNKNOWN")
        counts = {
            "confirmed_items": summary.get("confirmed_items"),
            "weak_confirmed": summary.get("weak_confirmed"),
            "style_confirmed": summary.get("style_confirmed"),
            "sampler_unknown": summary.get("sampler_unknown"),
            "dsp_only": summary.get("dsp_only"),
        }
        if counts != {"confirmed_items": 4, "weak_confirmed": 1, "style_confirmed": 1, "sampler_unknown": 1, "dsp_only": 1}:
            errors.append(f"unexpected counts: {counts}")
        if status == "PASS_WITH_WARNINGS":
            warnings.extend(summary.get("warnings", []))

    result = {
        "status": "FAIL" if errors else ("WARN" if warnings else "PASS"),
        "engine_status": status,
        "counts": counts,
        "errors": errors,
        "warnings": warnings,
        "safety": {
            "read_only": True,
            "original_set_modified": False,
            "usb_write": False,
            "pa3x_load": False,
            "binary_writer": False,
            "sample_extraction": False,
            "app_js_touched": False,
            "deploy_payment": False,
        },
    }
    RESULT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
