import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PC_WORKSTATION_ROOT = ROOT.parents[1]
ELECTRON = ROOT / "electron"
GENERATED_ROOT = PC_WORKSTATION_ROOT / "generated" / "uaos-pc-workstation-v28-electron-local-build"
RESULT_PATH = ROOT / "validator" / "VALIDATOR_V28_ELECTRON_BUILD_RESULT.json"


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def latest_run():
    runs = sorted(GENERATED_ROOT.glob("run-*"))
    return runs[-1] if runs else None


def is_inside(path, parent):
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def main():
    package_json = ELECTRON / "package.json"
    main_js = ELECTRON / "main.js"
    preload_js = ELECTRON / "preload.js"
    start_cmd = ELECTRON / "START_ELECTRON_LOCAL.cmd"
    build_cmd = ELECTRON / "BUILD_ELECTRON_LOCAL.cmd"
    v27_home = ROOT / "UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html"
    v25_app = ROOT / "UAOS_PC_WORKSTATION_APP_V25.html"
    node_modules = ELECTRON / "node_modules"
    dist_local = ELECTRON / "dist-local"
    local_build = ELECTRON / "local-build"
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    add("Electron workspace exists", ELECTRON.exists(), str(ELECTRON))
    add("package.json exists", package_json.exists(), str(package_json))
    add("main.js exists", main_js.exists(), str(main_js))
    add("preload.js exists", preload_js.exists(), str(preload_js))
    add("START_ELECTRON_LOCAL.cmd exists", start_cmd.exists(), str(start_cmd))
    add("BUILD_ELECTRON_LOCAL.cmd exists", build_cmd.exists(), str(build_cmd))
    add("V27 owner beta home exists", v27_home.exists(), str(v27_home))
    add("V25 app exists", v25_app.exists(), str(v25_app))

    main_text = read(main_js)
    package_text = read(package_json)
    cmd_text = read(start_cmd) + "\n" + read(build_cmd)
    add("no external URLs in main.js", not re.search(r"https?://", main_text))
    unsafe_script = re.search(r'"(deploy|payment|release|publish)"\s*:', package_text, re.IGNORECASE)
    unsafe_payment = re.search(r"(stripe|charge|collect\s+payment)", package_text, re.IGNORECASE)
    add("no deploy/payment scripts", not unsafe_script and not unsafe_payment)
    add("no USB action", not re.search(r"^\s*(copy|xcopy|robocopy)\b.*\bUSB\b", cmd_text, re.IGNORECASE | re.MULTILINE) and "USB:\\" not in cmd_text)
    add("no PA3X claim", "PA3X_READY" not in package_text + main_text + cmd_text)
    add("no App.jsx", not any(path.name == "App.jsx" for path in ROOT.rglob("*") if path.is_file()))

    repo_node_modules = [p for p in PC_WORKSTATION_ROOT.rglob("node_modules") if p.is_dir()]
    bad_node_modules = [str(p) for p in repo_node_modules if not is_inside(p, ELECTRON)]
    add("node_modules exists only under electron workspace if installed", not bad_node_modules, json.dumps(bad_node_modules, indent=2))

    build_dirs = [p for p in [dist_local, local_build] if p.exists()]
    add("dist/local-build exists only under electron workspace if built", all(is_inside(p, ELECTRON) for p in build_dirs), ", ".join(str(p) for p in build_dirs))

    forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED", "REAL_PA3X_SET", "HARDWARE_VERIFIED", "PRODUCTION_READY_FOR_KEYBOARD"]
    scan_text = "\n".join(read(p) for p in [package_json, main_js, preload_js, start_cmd, build_cmd])
    hits = [term for term in forbidden if term in scan_text]
    add("forbidden strings absent as claims", not hits, ", ".join(hits))

    build_outputs = []
    for base in [dist_local, local_build]:
      if base.exists():
        build_outputs.extend([p for p in base.rglob("*")])
    outside = [str(p) for p in build_outputs if not is_inside(p, PC_WORKSTATION_ROOT)]
    add("build output stayed inside repo", not outside, json.dumps(outside, indent=2))
    add("local desktop package folder exists", (dist_local / "win-unpacked").exists() or local_build.exists(), str(dist_local / "win-unpacked"))

    failed = [check for check in checks if not check["ok"]]
    status = "PASS" if not failed else "FAIL"
    result = {
        "status": status,
        "validated_at": datetime.now().isoformat(timespec="seconds"),
        "stable_folder": str(ROOT),
        "electron_workspace": str(ELECTRON),
        "checks": checks,
        "failed": failed,
    }
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    run_dir = latest_run()
    if run_dir:
        lines = ["# V28 Validator Report", "", f"Status: {status}", f"Validated at: {result['validated_at']}", ""]
        for check in checks:
            lines.append(f"- {'PASS' if check['ok'] else 'FAIL'}: {check['name']} {check['detail']}".rstrip())
        (run_dir / "reports" / "V28_VALIDATOR_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "result": str(RESULT_PATH)}, ensure_ascii=False))
    raise SystemExit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
