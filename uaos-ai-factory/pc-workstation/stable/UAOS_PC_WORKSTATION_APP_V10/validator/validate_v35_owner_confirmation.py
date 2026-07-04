import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "owner_confirmation" / "analysis_outputs"
RESULT = Path(__file__).resolve().parent / "VALIDATOR_V35_CONFIRMATION_RESULT.json"

REQUIRED_FILES = [
    ROOT / "owner_confirmation" / "uaos_v35_confirmation_builder.py",
    ROOT / "owner_confirmation" / "RUN_V35_CONFIRMATION_BUILD.cmd",
    OUT / "V35_CONFIRMATION_ITEMS.json",
    OUT / "V35_CONFIRMATION_ITEMS.csv",
    OUT / "V35_OWNER_CONFIRMATION_GUIDE_AR.md",
    OUT / "V35_RECOMMENDATION_UPGRADE_PLAN_AR.md",
    OUT / "V35_CONFIRMED_METADATA_TEMPLATE.json",
    ROOT / "UAOS_PC_WORKSTATION_APP_V35_OWNER_CONFIRMATION.html",
    ROOT / "assets" / "uaos_v35_owner_confirmation.css",
    ROOT / "assets" / "uaos_v35_owner_confirmation.js",
    ROOT / "START_UAOS_PC_WORKSTATION_V35_CONFIRMATION.cmd",
    ROOT / "OPEN_V35_CONFIRMATION.cmd",
    ROOT / "OPEN_V35_RESULTS.cmd",
    ROOT / "OPEN_V35_SUMMARY.cmd",
]

OPENER_SCRIPTS = [
    ROOT / "OPEN_V35_CONFIRMATION.cmd",
    ROOT / "OPEN_V35_RESULTS.cmd",
    ROOT / "OPEN_V35_SUMMARY.cmd",
    ROOT / "START_UAOS_PC_WORKSTATION_V35_CONFIRMATION.cmd",
    ROOT / "OPEN_ALL_RESULTS.cmd",
]

FORBIDDEN_COMMANDS = ["del", "erase", "move", "copy", "xcopy", "robocopy", "format"]
FORBIDDEN_TEXT = [
    "deploy:" + " yes",
    "payment:" + " yes",
    "load_to_" + "pa3x",
    "usb_" + "copy" + "_executed",
    "real_" + "pa3x" + "_set",
    "hardware_" + "verified",
    "production_ready_for_" + "keyboard",
    "pa3x" + "_ready",
    "korg" + "_compatible",
]
ALLOWED_CMD_STARTS = ("@echo off", "echo", "if exist", "pause")


def read_text(path):
    return path.read_text(encoding="utf-8", errors="replace")


def command_lines(path):
    lines = []
    for raw in read_text(path).splitlines():
        line = raw.strip()
        if line:
            lines.append(line)
    return lines


def validate_cmd(path):
    errors = []
    warnings = []
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
    for token in FORBIDDEN_TEXT:
        if token in low:
            errors.append(f"{path.name}: forbidden token {token}")
    for line in command_lines(path):
        if not line.lower().startswith(ALLOWED_CMD_STARTS):
            warnings.append(f"{path.name}: nonstandard line: {line}")
    return errors, warnings


def main():
    errors = []
    warnings = []
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"missing: {path}")
    for path in OPENER_SCRIPTS:
        if path.exists():
            cmd_errors, cmd_warnings = validate_cmd(path)
            errors.extend(cmd_errors)
            warnings.extend(cmd_warnings)
        else:
            errors.append(f"missing opener: {path}")

    items_path = OUT / "V35_CONFIRMATION_ITEMS.json"
    item_count = 0
    if items_path.exists():
        try:
            items = json.loads(read_text(items_path))
            item_count = len(items)
            if item_count < 1:
                errors.append("confirmation items are empty")
            for item in items:
                choices = item.get("allowed_choices", [])
                if "unknown" not in choices or "confirm_dsp_only" not in choices:
                    errors.append(f"{item.get('id', 'item')}: allowed choices incomplete")
        except json.JSONDecodeError as exc:
            errors.append(f"invalid JSON: {exc}")

    js_path = ROOT / "assets" / "uaos_v35_owner_confirmation.js"
    if js_path.exists():
        js = read_text(js_path)
        if "localStorage" not in js:
            errors.append("UI missing localStorage")
        if "UAOS_OWNER_CONFIRMATIONS_V35.json" not in js:
            errors.append("UI missing export file name")

    result = {
        "status": "FAIL" if errors else ("WARN" if warnings else "PASS"),
        "items_for_owner_review": item_count,
        "required_files_checked": len(REQUIRED_FILES),
        "opener_scripts_checked": len(OPENER_SCRIPTS),
        "errors": errors,
        "warnings": warnings,
        "safety": {
            "read_only": True,
            "original_set_modified": False,
            "usb_write": False,
            "pa3x_load": False,
            "binary_writer": False,
            "sample_extraction": False,
            "deploy_payment": False,
        },
    }
    RESULT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
