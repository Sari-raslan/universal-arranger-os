import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v27-owner-beta-polish"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V27_OWNER_BETA_POLISH_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def main():
    paths = {
        "Beta home V27": ROOT / "UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html",
        "Start cmd V27": ROOT / "START_UAOS_PC_WORKSTATION_BETA_V27.cmd",
        "Smoke test dashboard": ROOT / "dash" / "UAOS_PC_WORKSTATION_BETA_SMOKE_TEST_V27.html",
        "Smoke test data": ROOT / "dash" / "owner_beta_smoke_test_v27_data.json",
        "V25 app": ROOT / "UAOS_PC_WORKSTATION_APP_V25.html",
        "Project editor": ROOT / "editor" / "UAOS_PROJECT_EDITOR_V13.html",
        "Style editor": ROOT / "style_editor" / "UAOS_STYLE_SECTION_EDITOR_V14.html",
        "Library manager": ROOT / "library" / "UAOS_LIBRARY_MANAGER_V25.html",
        "Audio preview": ROOT / "preview" / "UAOS_AUDIO_PREVIEW_V25.html",
        "Writer cmd": ROOT / "writer" / "RUN_WRITER_V17.cmd",
        "Writer outputs": ROOT / "writer" / "generated_v17_outputs",
        "MIDI": ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid",
        "Self-check": ROOT / "dash" / "UAOS_PC_WORKSTATION_SELF_CHECK_V18.html",
        "Electron plan": ROOT / "electron" / "ELECTRON_PACKAGING_PLAN_V24.md",
        "Home": ROOT / "UAOS_PC_WORKSTATION_HOME.html",
    }
    docs = [
        ROOT / "docs" / "OWNER_BETA_V27_START_HERE_AR.md",
        ROOT / "docs" / "OWNER_BETA_V27_QUICK_TEST_AR.md",
        ROOT / "docs" / "OWNER_BETA_V27_TROUBLESHOOTING_AR.md",
    ]
    scan_paths = [*paths.values(), *docs]
    combined = "\n".join(read(path) for path in scan_paths if path.is_file())
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    for name, path in paths.items():
        add(f"{name} exists", path.exists(), str(path))
    add("Owner docs exist", all(path.exists() for path in docs), ", ".join(str(path) for path in docs))
    home_text = read(paths["Home"])
    add("Home links to V27 beta", "UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html" in home_text and "START_UAOS_PC_WORKSTATION_BETA_V27.cmd" in home_text)
    labels = ["PC_ONLY", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD"]
    missing = [label for label in labels if label not in combined]
    add("safety labels present", not missing, ", ".join(missing))

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    hits = []
    for path in scan_paths:
        text = read(path) if path.is_file() else ""
        for term in forbidden:
            if term in text:
                hits.append({"file": str(path), "term": term})
    add("forbidden strings absent", not hits, json.dumps(hits, indent=2))
    add("no node_modules", not (ROOT / "electron" / "node_modules").exists())
    add("no dist/release/installer", not (ROOT / "electron" / "dist").exists() and not (ROOT / "electron" / "release").exists() and not any("installer" in p.name.lower() for p in (ROOT / "electron").iterdir()))
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))
    unsafe_release = re.search(r"^\s*(deploy|vercel|netlify|npm\s+publish|stripe|charge|collect\s+payment)\b", combined, re.IGNORECASE | re.MULTILINE)
    add("no deploy/payment", not unsafe_release)
    add("no owner-fixture path", "owner-fixtures" not in combined.lower())
    add("no proprietary samples", not re.search(r"(proprietary[\\/]|copy.*proprietary|samples[\\/].*proprietary)", combined, re.IGNORECASE))

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {"status": status, "validated_at": datetime.now().isoformat(timespec="seconds"), "stable_folder": str(ROOT), "checks": checks, "failed": failed}
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    run_dir = latest_run()
    if run_dir:
        lines = ["# V27 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V27_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
