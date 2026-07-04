import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v25-audio-library-polish"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V25_AUDIO_LIBRARY_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    app = ROOT / "UAOS_PC_WORKSTATION_APP_V25.html"
    css = ROOT / "assets" / "uaos_v25_theme.css"
    js = ROOT / "assets" / "uaos_v25_app.js"
    data_files = [
        ROOT / "data" / "v25_audio_patterns.json",
        ROOT / "data" / "v25_arabic_strings_library.json",
        ROOT / "data" / "v25_track_mapping.json",
    ]
    lib_manager = ROOT / "library" / "UAOS_LIBRARY_MANAGER_V25.html"
    preview = ROOT / "preview" / "UAOS_AUDIO_PREVIEW_V25.html"
    start_cmd = ROOT / "START_UAOS_PC_WORKSTATION_V25.cmd"
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    writer = ROOT / "writer" / "RUN_WRITER_V17.cmd"
    midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
    scan_paths = [app, css, js, *data_files, lib_manager, preview, start_cmd, home, ROOT / "docs" / "START_HERE_V25_AR.md", ROOT / "docs" / "V25_AUDIO_LIBRARY_POLISH_NOTES_AR.md"]
    combined = "\n".join(read(path) for path in scan_paths)
    app_text = read(app)
    js_text = read(js)
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("V25 app exists", app.exists(), str(app))
    add("V25 CSS/JS exist", css.exists() and js.exists())
    add("V25 data files exist", all(path.exists() for path in data_files))
    add("library manager V25 exists", lib_manager.exists(), str(lib_manager))
    add("audio preview V25 exists", preview.exists(), str(preview))
    add("start cmd exists", start_cmd.exists(), str(start_cmd))
    add("home links to V25", "UAOS_PC_WORKSTATION_APP_V25.html" in read(home) and "START_UAOS_PC_WORKSTATION_V25.cmd" in read(home))
    add("WebAudio functions present", "AudioContext" in js_text and "createOscillator" in js_text and "playMode" in js_text)
    add("WebAudio modes present", all(mode in js_text + app_text for mode in ["chords", "bass", "strings_pulse", "strings_tremolo", "full"]))
    add("preset data exists", "Arabic Strings Cinematic Wide" in combined and "Arabic Violin Emotional Lead" in combined)
    add("export functions exist", "function exportJson" in js_text and "exportLibraryBinding" in js_text and "exportAudioPattern" in js_text)
    add("writer RUN_WRITER_V17.cmd preserved", writer.exists(), str(writer))
    add("MIDI exists", midi.exists(), str(midi))
    labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NO_SAMPLES_INCLUDED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
    missing_labels = [label for label in labels if label not in combined]
    add("safety labels present", not missing_labels, ", ".join(missing_labels))

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    hits = []
    for path in scan_paths:
        text = read(path)
        for term in forbidden:
            if term in text:
                hits.append({"file": str(path), "term": term})
    add("forbidden strings absent", not hits, json.dumps(hits, indent=2))
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    add("no deploy/payment", not re.search(r"\b(run|start|execute|send|charge|collect)\b.*\b(deploy|payment)\b", combined, re.IGNORECASE))
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary sample path", not re.search(r"(proprietary[\\/]|copy.*proprietary|samples[\\/].*proprietary)", combined, re.IGNORECASE))
    add("no external URL", not re.search(r"https?://", combined))
    add("no USB action", not re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", combined, re.IGNORECASE | re.MULTILINE) and "USB:\\" not in combined)
    electron = ROOT / "electron"
    add("no node_modules/dist/release/installer created", not (electron / "node_modules").exists() and not (electron / "dist").exists() and not (electron / "release").exists() and not any("installer" in p.name.lower() for p in electron.iterdir()))

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {"status": status, "validated_at": datetime.now().isoformat(timespec="seconds"), "stable_folder": str(ROOT), "checks": checks, "failed": failed}
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        lines = ["# V25 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V25_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
