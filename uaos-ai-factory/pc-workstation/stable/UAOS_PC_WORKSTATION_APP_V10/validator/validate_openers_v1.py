import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OPENERS = [
    "OPEN_THIS_FIRST.cmd",
    "OPEN_ALL_RESULTS.cmd",
    "OPEN_MAIN_APP.cmd",
    "OPEN_SET_ANALYZER.cmd",
    "OPEN_OWNER_SET_INPUT.cmd",
    "OPEN_WRITER_OUTPUTS.cmd",
    "OPEN_MIDI.cmd",
    "OPEN_ELECTRON_EXE_FOLDER.cmd",
]

failures = []
warnings = []

for name in OPENERS:
    path = ROOT / name
    if not path.exists():
        failures.append(f"missing opener: {name}")
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    lower = text.lower()
    for pattern in [
        r"(?m)^\s*del\b",
        r"(?m)^\s*erase\b",
        r"(?m)^\s*move\b",
        r"(?m)^\s*copy\b",
        r"(?m)^\s*xcopy\b",
        r"(?m)^\s*robocopy\b",
        r"(?m)^\s*format\b",
    ]:
        if re.search(pattern, lower):
            failures.append(f"unsafe command in {name}: {pattern}")
    if re.search(r"(?i)\busb\s*[:\\]", text):
        failures.append(f"USB target path found in {name}")
    if "load_to_pa3x" in lower or "pa3x load" in lower:
        failures.append(f"PA3X load action found in {name}")
    if "deploy: yes" in lower or "payment: yes" in lower:
        failures.append(f"deploy/payment affirmative claim found in {name}")
    for raw_line in text.splitlines():
        line = raw_line.strip().lower()
        if not line or line.startswith("rem "):
            continue
        allowed = (
            line == "@echo off"
            or line.startswith("echo")
            or line.startswith("if exist")
            or line.startswith("if not exist")
            or line.startswith("start ")
            or line.startswith("explorer ")
            or line == "pause"
        )
        if not allowed:
            warnings.append(f"non-standard opener line in {name}: {raw_line.strip()}")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "openers": {name: str(ROOT / name) for name in OPENERS},
    "delete_move_copy_performed": "NO",
    "usb_action": "NO",
    "pa3x_action": "NO",
    "deploy_payment": "NO",
    "warnings": warnings,
    "failures": failures,
}

(ROOT / "validator" / "VALIDATOR_OPENERS_V1_RESULT.json").write_text(
    json.dumps(result, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
print(json.dumps(result, indent=2, ensure_ascii=False))
