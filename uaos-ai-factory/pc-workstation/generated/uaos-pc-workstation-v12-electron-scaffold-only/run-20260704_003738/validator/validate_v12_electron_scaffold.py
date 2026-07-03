import json
from pathlib import Path


REPO = Path(r"E:\keyboard-manager-clean")
STABLE = REPO / "uaos-ai-factory" / "pc-workstation" / "stable" / "UAOS_PC_WORKSTATION_APP_V10"
ELECTRON = STABLE / "electron"
RUN_ROOT = REPO / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v12-electron-scaffold-only" / "run-20260704_003738"
RESULT = RUN_ROOT / "validator" / "VALIDATOR_RESULT.json"


def read_text(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""


checks = []


def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


required = [
    ELECTRON / "package.json",
    ELECTRON / "main.js",
    ELECTRON / "preload.js",
    ELECTRON / "START_ELECTRON_DEV.cmd",
    ELECTRON / "README_ELECTRON_LOCAL_ONLY.md",
    ELECTRON / "ELECTRON_SAFETY_POLICY.md",
]

for path in required:
    check(f"{path.name} exists", path.exists(), str(path))

package_text = read_text(ELECTRON / "package.json")
main_text = read_text(ELECTRON / "main.js")
preload_text = read_text(ELECTRON / "preload.js")
start_text = read_text(ELECTRON / "START_ELECTRON_DEV.cmd")
all_text = "\n".join(read_text(path) for path in required)

check("package has expected name", '"name": "uaos-pc-workstation"' in package_text, "package.json")
check("package has expected version", '"version": "0.12.0"' in package_text, "package.json")
check("package has start script only", '"start": "electron ."' in package_text and "postinstall" not in package_text and "preinstall" not in package_text, "package.json")
check("main loads local home file", "loadFile(homePath)" in main_text and "UAOS_PC_WORKSTATION_HOME.html" in main_text, "main.js")
check("main has no external URL load", "loadURL" not in main_text and "http://" not in main_text and "https://" not in main_text, "main.js")
check("preload is minimal label bridge", "contextBridge" in preload_text and "uaosApp" in preload_text, "preload.js")
check("start checks local electron dependency", "node_modules\\electron" in start_text, "START_ELECTRON_DEV.cmd")
check("start does not run package install", "npm install" not in start_text.lower() and "npm i" not in start_text.lower(), "START_ELECTRON_DEV.cmd")

forbidden_tokens = [
    "PA3X" + "_READY",
    "KORG" + "_COMPATIBLE",
    "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED",
    "REAL" + "_PA3X" + "_SET",
    "HARDWARE" + "_VERIFIED",
]
forbidden_markers = ["App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample"]
found = []
for token in forbidden_tokens + forbidden_markers:
    if token.lower() in all_text.lower():
        found.append(token)

check("no forbidden claims or paths", not found, json.dumps(found))
check("no external URLs", "http://" not in all_text and "https://" not in all_text, "electron scaffold")
executable_text = "\n".join([package_text, main_text, preload_text, start_text])
check("no deploy or payment behavior in executable scaffold", "deploy" not in executable_text.lower() and "payment" not in executable_text.lower(), "package/main/preload/start")

status = "PASS" if all(item["ok"] for item in checks) else "FAIL"
payload = {
    "status": status,
    "checks": checks,
    "electron_installed": "NO",
    "electron_executed": "NO",
    "npm_install_executed": "NO",
    "pa3x_ready_claim": "NO",
    "usb_write": "NO",
    "external_copy_outside_repo": "NO",
    "pa3x_load": "NO",
    "app_jsx_touched": "NO",
    "deploy_payment": "NO"
}

RESULT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
