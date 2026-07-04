import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v26-final-owner-beta"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V26_OWNER_BETA_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    owner_home = ROOT / "UAOS_PC_WORKSTATION_OWNER_BETA_HOME.html"
    beta_launcher = ROOT / "START_UAOS_PC_WORKSTATION_BETA.cmd"
    v25_app = ROOT / "UAOS_PC_WORKSTATION_APP_V25.html"
    v25_start = ROOT / "START_UAOS_PC_WORKSTATION_V25.cmd"
    v25_preview = ROOT / "preview" / "UAOS_AUDIO_PREVIEW_V25.html"
    v25_library = ROOT / "library" / "UAOS_LIBRARY_MANAGER_V25.html"
    project_editor = ROOT / "editor" / "UAOS_PROJECT_EDITOR_V13.html"
    style_editor = ROOT / "style_editor" / "UAOS_STYLE_SECTION_EDITOR_V14.html"
    writer = ROOT / "writer" / "RUN_WRITER_V17.cmd"
    writer_outputs = ROOT / "writer" / "generated_v17_outputs"
    midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
    self_check = ROOT / "dash" / "UAOS_PC_WORKSTATION_SELF_CHECK_V18.html"
    electron_plan = ROOT / "electron" / "ELECTRON_PACKAGING_PLAN_V24.md"
    dashboard = ROOT / "dash" / "UAOS_PC_WORKSTATION_OWNER_BETA_DASHBOARD_V26.html"
    home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
    docs = [
        ROOT / "docs" / "OWNER_BETA_START_HERE_AR.md",
        ROOT / "docs" / "OWNER_BETA_START_HERE_EN.md",
        ROOT / "docs" / "WHAT_WORKS_NOW_V26_AR.md",
        ROOT / "docs" / "WHAT_IS_NOT_READY_YET_V26_AR.md",
        ROOT / "docs" / "OWNER_BETA_TEST_CHECKLIST_V26_AR.md",
        ROOT / "docs" / "OWNER_BETA_DAILY_WORKFLOW_V26_AR.md",
    ]
    scan_paths = [owner_home, beta_launcher, dashboard, home, *docs, ROOT / "dash" / "owner_beta_v26_data.json"]
    combined = "\n".join(read(path) for path in scan_paths)
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("Owner beta home exists", owner_home.exists(), str(owner_home))
    add("Beta launcher exists", beta_launcher.exists(), str(beta_launcher))
    add("V25 app exists", v25_app.exists(), str(v25_app))
    add("V25 start cmd exists", v25_start.exists(), str(v25_start))
    add("V25 audio preview exists", v25_preview.exists(), str(v25_preview))
    add("V25 library manager exists", v25_library.exists(), str(v25_library))
    add("Project editor V13 exists", project_editor.exists(), str(project_editor))
    add("Style editor V14 exists", style_editor.exists(), str(style_editor))
    add("Writer V17 exists", writer.exists(), str(writer))
    add("Writer outputs exist", writer_outputs.exists(), str(writer_outputs))
    add("MIDI preview exists", midi.exists(), str(midi))
    add("Self-check V18 exists", self_check.exists(), str(self_check))
    add("Electron plan V24 exists", electron_plan.exists(), str(electron_plan))
    add("Owner docs exist", all(path.exists() for path in docs))
    add("Daily workflow dashboard exists", dashboard.exists(), str(dashboard))
    add("Home links to Owner Beta V26", "UAOS_PC_WORKSTATION_OWNER_BETA_HOME.html" in read(home) and "START_UAOS_PC_WORKSTATION_BETA.cmd" in read(home))

    labels = ["PC_ONLY", "OWNER_BETA", "TEST_UNVERIFIED"]
    missing = [label for label in labels if label not in combined]
    add("safety labels present", not missing, ", ".join(missing))

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    hits = []
    for path in scan_paths:
        text = read(path)
        for term in forbidden:
            if term in text:
                hits.append({"file": str(path), "term": term})
    add("forbidden strings absent", not hits, json.dumps(hits, indent=2))
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    unsafe_release = re.search(r"^\s*(deploy|vercel|netlify|npm\s+publish|stripe|charge|collect\s+payment)\b", combined, re.IGNORECASE | re.MULTILINE)
    add("no deploy/payment", not unsafe_release)
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary sample path", not re.search(r"(proprietary[\\/]|copy.*proprietary|samples[\\/].*proprietary)", combined, re.IGNORECASE))
    electron = ROOT / "electron"
    add("no node_modules/dist/release/installer created", not (electron / "node_modules").exists() and not (electron / "dist").exists() and not (electron / "release").exists() and not any("installer" in p.name.lower() for p in electron.iterdir()))
    add("no external copy outside repo", "external copy" not in combined.lower())

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {"status": status, "validated_at": datetime.now().isoformat(timespec="seconds"), "stable_folder": str(ROOT), "checks": checks, "failed": failed}
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        lines = ["# V26 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V26_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
