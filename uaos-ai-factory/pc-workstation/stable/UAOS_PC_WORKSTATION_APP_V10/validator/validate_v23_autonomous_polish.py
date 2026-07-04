import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v23-autonomous-polish"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V23_POLISH_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    app = ROOT / "UAOS_PC_WORKSTATION_APP_V23.html"
    css = ROOT / "assets" / "uaos_v23_theme.css"
    js = ROOT / "assets" / "uaos_v23_app.js"
    data_files = [ROOT / "data" / "v23_default_project.json", ROOT / "data" / "v23_ui_selftest.json"]
    start_cmd = ROOT / "START_UAOS_PC_WORKSTATION_V23.cmd"
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    docs = [ROOT / "docs" / "START_HERE_V23_AR.md", ROOT / "docs" / "V23_POLISH_NOTES_AR.md"]
    scan_paths = [app, css, js, *data_files, start_cmd, home, *docs]
    app_text = read(app)
    js_text = read(js)
    combined = "\n".join(read(path) for path in scan_paths)
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("V23 app exists", app.exists(), str(app))
    add("CSS exists", css.exists(), str(css))
    add("JS exists", js.exists(), str(js))
    add("data exists", all(path.exists() for path in data_files))
    add("start cmd exists", start_cmd.exists(), str(start_cmd))
    add("Home links to V23", "UAOS_PC_WORKSTATION_APP_V23.html" in read(home) and "START_UAOS_PC_WORKSTATION_V23.cmd" in read(home))

    panels = ["Dashboard", "Project", "Arrangement", "Style", "Library", "Player", "Writer", "Files", "Safety", "Help", "Daily Workflow", "Self-Test"]
    missing_panels = [panel for panel in panels if panel not in app_text]
    add("panels exist including Daily Workflow and Self-Test", not missing_panels, ", ".join(missing_panels))
    add("self-test button/function exists", "Run UI Self-Test" in app_text and "function selfTest" in js_text)
    add("export functions exist", "function exportJson" in js_text and "Blob" in js_text)
    add("WebAudio functions exist", "AudioContext" in js_text and "createOscillator" in js_text)
    add("localStorage functions exist", "localStorage" in js_text and "saveState" in js_text and "loadState" in js_text)
    add("navigation exists", "function switchView" in js_text and ".nav button" in js_text)
    add("preset selection exists", "selectPresetByName" in js_text)
    add("arrangement selection exists", "selectSection" in js_text)

    labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
    missing_labels = [label for label in labels if label not in combined]
    add("safety labels present", not missing_labels, ", ".join(missing_labels))

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    hits = []
    for path in scan_paths:
        text = read(path)
        for term in forbidden:
            if term in text and path != js:
                hits.append({"file": str(path), "term": term})
    add("forbidden strings absent", not hits, json.dumps(hits, indent=2))
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    add("no deploy/payment action", not re.search(r"\b(run|start|execute|send|charge|collect)\b.*\b(deploy|payment)\b", combined, re.IGNORECASE))
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary sample path", not re.search(r"(proprietary[\\/]|samples[\\/].*proprietary|copy.*proprietary)", combined, re.IGNORECASE))
    add("no external URL", not re.search(r"https?://", combined))
    add("no USB action", not re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", combined, re.IGNORECASE | re.MULTILINE) and "USB:\\" not in combined)

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {"status": status, "validated_at": datetime.now().isoformat(timespec="seconds"), "stable_folder": str(ROOT), "checks": checks, "failed": failed}
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        lines = ["# V23 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V23_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
