import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v24-electron-packaging-plan"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V24_ELECTRON_PLAN_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    v23_app = ROOT / "UAOS_PC_WORKSTATION_APP_V23.html"
    electron = ROOT / "electron"
    plan = electron / "ELECTRON_PACKAGING_PLAN_V24.md"
    file_map = electron / "ELECTRON_FILE_MAP_V24.json"
    safe_steps = electron / "ELECTRON_SAFE_INSTALL_STEPS_V24.md"
    not_executed = electron / "ELECTRON_BUILD_NOT_EXECUTED_V24.md"
    docs = [
        ROOT / "docs" / "V24_ELECTRON_PACKAGING_PLAN_AR.md",
        ROOT / "docs" / "V24_ELECTRON_PACKAGING_PLAN_EN.md",
    ]
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    scan_paths = [plan, file_map, safe_steps, not_executed, *docs, home]
    combined = "\n".join(read(path) for path in scan_paths)
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("V23 app exists", v23_app.exists(), str(v23_app))
    add("Electron scaffold exists", electron.exists() and (electron / "package.json").exists(), str(electron))
    add("V24 plan files exist", plan.exists() and file_map.exists(), f"{plan}; {file_map}")
    add("V24 safe install docs exist", safe_steps.exists(), str(safe_steps))
    add("V24 build-not-executed doc exists", not_executed.exists(), str(not_executed))
    home_text = read(home)
    add("Home mentions V23/V24 correctly", "V23 is the current tested web app" in home_text and "V24 is packaging plan only" in home_text)

    add("no npm install evidence", "node_modules" not in [p.name for p in electron.iterdir()] and not (electron / "package-lock.json").exists())
    add("no node_modules created by this run", not (electron / "node_modules").exists())
    add("no dist/release installer created", not (electron / "dist").exists() and not (electron / "release").exists() and not any("installer" in p.name.lower() for p in electron.iterdir()))
    add("no external URLs", not re.search(r"https?://", combined))
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    add("no deploy/payment action", not re.search(r"\b(run|start|execute|send|charge|collect)\b.*\b(deploy|payment)\b", combined, re.IGNORECASE))
    add("no USB action", not re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", combined, re.IGNORECASE | re.MULTILINE) and "USB:\\" not in combined)

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    hits = []
    for path in scan_paths:
        text = read(path)
        for term in forbidden:
            if term in text:
                hits.append({"file": str(path), "term": term})
    add("forbidden claims absent", not hits, json.dumps(hits, indent=2))
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary content copy path", not re.search(r"(proprietary[\\/]|copy.*proprietary)", combined, re.IGNORECASE))

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {"status": status, "validated_at": datetime.now().isoformat(timespec="seconds"), "stable_folder": str(ROOT), "checks": checks, "failed": failed}
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        lines = ["# V24 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V24_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
