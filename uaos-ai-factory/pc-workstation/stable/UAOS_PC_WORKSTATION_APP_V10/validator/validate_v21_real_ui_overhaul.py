import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v21-real-ui-overhaul"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V21_REAL_UI_RESULT.json"


def latest_run_dir():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def read_text(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def contains_all(text, terms):
    return [term for term in terms if term not in text]


def scan_forbidden(paths):
    fragments = [
        ("PA3X", "_READY"),
        ("KORG", "_COMPATIBLE"),
        ("LOAD", "_TO_", "PA3X"),
        ("USB", "_COPY_", "EXECUTED"),
        ("REAL", "_PA3X_", "SET"),
        ("HARDWARE", "_VERIFIED"),
        ("PRODUCTION", "_READY_", "FOR_KEYBOARD"),
    ]
    forbidden = ["".join(parts) for parts in fragments]
    hits = []
    for path in paths:
        text = read_text(path)
        for term in forbidden:
            if term in text:
                hits.append({"file": str(path), "term": term})
    return hits


def main():
    app = ROOT / "UAOS_PC_WORKSTATION_APP_V21.html"
    css = ROOT / "assets" / "uaos_v21_theme.css"
    js = ROOT / "assets" / "uaos_v21_app.js"
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    start_cmd = ROOT / "START_UAOS_PC_WORKSTATION_V21.cmd"
    data_files = [
        ROOT / "data" / "v21_default_project.json",
        ROOT / "data" / "v21_library_presets.json",
        ROOT / "data" / "v21_style_sections.json",
    ]
    writer = ROOT / "writer" / "RUN_WRITER_V17.cmd"
    midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
    docs = [
        ROOT / "docs" / "START_HERE_V21_AR.md",
        ROOT / "docs" / "START_HERE_V21_EN.md",
    ]
    scan_paths = [app, css, js, home, start_cmd, *data_files, *docs]
    app_text = read_text(app)
    js_text = read_text(js)
    home_text = read_text(home)
    combined = "\n".join(read_text(path) for path in scan_paths)

    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("V21 app exists", app.exists(), str(app))
    add("CSS exists", css.exists(), str(css))
    add("JS exists", js.exists(), str(js))
    add("data files exist", all(path.exists() for path in data_files), ", ".join(str(path) for path in data_files))
    add("start cmd exists", start_cmd.exists(), str(start_cmd))
    add("Home links to V21", "UAOS_PC_WORKSTATION_APP_V21.html" in home_text and "START_UAOS_PC_WORKSTATION_V21.cmd" in home_text)

    panel_terms = ["Dashboard", "Project", "Arrangement", "Style", "Library", "Player", "Writer", "Files", "Safety", "Help"]
    missing_panels = contains_all(app_text, panel_terms)
    add("V21 contains required panels", not missing_panels, "missing: " + ", ".join(missing_panels) if missing_panels else "all present")

    add("export JSON functions", "function exportJson" in js_text and "Blob" in js_text)
    add("WebAudio preview functions", "AudioContext" in js_text and "createOscillator" in js_text and "function stopAudio" in js_text)

    labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
    missing_labels = contains_all(combined, labels)
    add("safety labels present", not missing_labels, "missing: " + ", ".join(missing_labels) if missing_labels else "all present")
    add("writer RUN_WRITER_V17.cmd exists", writer.exists(), str(writer))
    add("MIDI exists", midi.exists(), str(midi))

    forbidden_hits = scan_forbidden(scan_paths)
    add("forbidden compatibility strings absent", not forbidden_hits, json.dumps(forbidden_hits, indent=2))
    add("no App.jsx created in stable", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    unsafe_release_action = re.search(r"\b(run|start|execute|send|charge|collect)\b.*\b(deploy|payment)\b", app_text, re.IGNORECASE)
    add("no deploy/payment action in V21 app", not unsafe_release_action)
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary sample path", "proprietary" not in combined.lower() or "Proprietary samples</td><td>NO" in combined)
    add("no external URL", not re.search(r"https?://", combined))
    copy_command = re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", combined, re.IGNORECASE | re.MULTILINE)
    add("no USB copy command", not copy_command)

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

    run_dir = latest_run_dir()
    if run_dir:
        report_path = run_dir / "reports" / "V21_VALIDATOR_REPORT.md"
        lines = [
            "# V21 Validator Report",
            "",
            f"Status: {status}",
            f"Validated at: {result['validated_at']}",
            "",
        ]
        for check in checks:
            mark = "PASS" if check["ok"] else "FAIL"
            lines.append(f"- {mark}: {check['name']} - {check['detail']}")
        report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
