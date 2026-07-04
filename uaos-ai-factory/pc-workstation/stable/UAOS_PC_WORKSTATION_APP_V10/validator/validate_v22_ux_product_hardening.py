import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v22-ux-product-hardening"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V22_UX_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    app = ROOT / "UAOS_PC_WORKSTATION_APP_V22.html"
    css = ROOT / "assets" / "uaos_v22_theme.css"
    js = ROOT / "assets" / "uaos_v22_app.js"
    data_files = [ROOT / "data" / "v22_project_state.json", ROOT / "data" / "v22_ui_selftest.json"]
    start_cmd = ROOT / "START_UAOS_PC_WORKSTATION_V22.cmd"
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    writer = ROOT / "writer" / "RUN_WRITER_V17.cmd"
    midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
    docs = [
      ROOT / "docs" / "START_HERE_V22_AR.md",
      ROOT / "docs" / "START_HERE_V22_EN.md",
      ROOT / "docs" / "V22_UX_FIX_REPORT_AR.md",
    ]
    scan_paths = [app, css, js, *data_files, start_cmd, home, *docs]
    app_text = read(app)
    js_text = read(js)
    css_text = read(css)
    home_text = read(home)
    combined = "\n".join(read(path) for path in scan_paths)
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("V22 app exists", app.exists(), str(app))
    add("CSS exists", css.exists(), str(css))
    add("JS exists", js.exists(), str(js))
    add("data files exist", all(path.exists() for path in data_files), ", ".join(str(path) for path in data_files))
    add("start cmd exists", start_cmd.exists(), str(start_cmd))
    add("home links to V22", "UAOS_PC_WORKSTATION_APP_V22.html" in home_text and "START_UAOS_PC_WORKSTATION_V22.cmd" in home_text)

    sections = ["Dashboard", "Project", "Arrangement", "Style", "Library", "Player", "Writer", "Files", "Safety", "Help"]
    missing_sections = [term for term in sections if term not in app_text]
    add("V22 contains required sections", not missing_sections, ", ".join(missing_sections))

    interactive = {
        "export JSON": "function exportJson" in js_text and "Blob" in js_text,
        "WebAudio": "AudioContext" in js_text and "createOscillator" in js_text,
        "localStorage": "localStorage" in js_text,
        "selfTest": "function selfTest" in js_text,
        "navigation": "function switchView" in js_text and ".nav button" in js_text,
    }
    for name, ok in interactive.items():
        add(f"interactive JS: {name}", ok)

    real_ui_terms = {
        "forms": "<input" in app_text and "<textarea" in app_text,
        "tables": "<table" in app_text,
        "timeline": "arrangementStrip" in app_text and "dashStrip" in app_text,
        "preset grid": "presetGrid" in app_text and "librarySearch" in app_text,
        "transport controls": "data-play=\"full\"" in app_text and "stopAudio" in app_text,
        "writer pipeline": "flow" in app_text and "writer\\RUN_WRITER_V17.cmd" in app_text,
        "safety matrix": "matrix" in app_text and "LOCKED" in app_text,
        "inspector compact layout": ".inspect" in css_text and "grid-template-columns:82px" in css_text,
        "bottom transport bar": ".bottom" in css_text,
    }
    for name, ok in real_ui_terms.items():
        add(f"real UI surface: {name}", ok)

    labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
    missing_labels = [label for label in labels if label not in combined]
    add("safety labels present", not missing_labels, ", ".join(missing_labels))
    add("writer runner preserved", writer.exists(), str(writer))
    add("MIDI preview preserved", midi.exists(), str(midi))

    forbidden = [
        "PA3X_READY",
        "KORG_COMPATIBLE",
        "LOAD_TO_PA3X",
        "USB_COPY_EXECUTED",
        "REAL_PA3X_SET",
        "HARDWARE_VERIFIED",
        "PRODUCTION_READY_FOR_KEYBOARD",
    ]
    hits = []
    for path in scan_paths:
        text = read(path)
        for term in forbidden:
            if term in text and path != js:
                hits.append({"file": str(path), "term": term})
    add("forbidden compatibility strings absent", not hits, json.dumps(hits, indent=2))
    add("no App.jsx in stable", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    unsafe_release = re.search(r"\b(run|start|execute|send|charge|collect)\b.*\b(deploy|payment)\b", combined, re.IGNORECASE)
    add("no deploy/payment action", not unsafe_release)
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    proprietary_path = re.search(r"(proprietary[\\/]|samples[\\/].*proprietary|copy.*proprietary)", combined, re.IGNORECASE)
    add("no proprietary sample path", not proprietary_path)
    add("no external URL", not re.search(r"https?://", combined))
    usb_copy_command = re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", combined, re.IGNORECASE | re.MULTILINE)
    add("no USB path/action", not usb_copy_command and "USB:\\" not in combined and "/USB" not in combined)

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {
        "status": status,
        "validated_at": datetime.now().isoformat(timespec="seconds"),
        "stable_folder": str(ROOT),
        "checks": checks,
        "failed": failed,
    }
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        report = run_dir / "reports" / "V22_VALIDATOR_REPORT.md"
        lines = ["# V22 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        report.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
