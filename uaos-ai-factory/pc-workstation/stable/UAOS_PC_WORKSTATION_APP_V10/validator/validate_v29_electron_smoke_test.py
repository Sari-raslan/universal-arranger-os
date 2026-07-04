import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
ELECTRON = ROOT / "electron"
SEAL = ROOT / "seal"
VALIDATOR = ROOT / "validator"
GENERATED = REPO / "uaos-ai-factory" / "pc-workstation" / "generated" / "uaos-pc-workstation-v29-electron-smoke-test" / "run-20260704_112149"


required_files = [
    ELECTRON / "START_ELECTRON_LOCAL_V29.cmd",
    ELECTRON / "SMOKE_TEST_ELECTRON_V29.cmd",
    ELECTRON / "ELECTRON_V29_WARNING_FIX_NOTES.md",
    ELECTRON / "ELECTRON_V29_SMOKE_TEST_README_AR.md",
    ELECTRON / "ELECTRON_V29_SMOKE_TEST_README_EN.md",
    ELECTRON / "ELECTRON_V29_PACKAGE_STATUS.json",
    ELECTRON / "package.json",
    ELECTRON / "main.js",
    ELECTRON / "preload.js",
    VALIDATOR / "validate_v29_electron_smoke_test.py",
    SEAL / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_SEAL.md",
    SEAL / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_SEAL.json",
    GENERATED / "reports" / "V29_ELECTRON_WARNING_DIAGNOSIS.md",
    GENERATED / "reports" / "V29_ELECTRON_SMOKE_TEST_REPORT.md",
    GENERATED / "reports" / "V29_VALIDATOR_REPORT.md",
    GENERATED / "reports" / "V29_QA_REPORT.md",
    GENERATED / "manifests" / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_MANIFEST.json",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_FINAL_SEAL.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_FINAL_SEAL.json",
]

required_paths = [
    ELECTRON / "dist-local" / "win-unpacked",
    ELECTRON / "dist-local" / "win-unpacked" / "UAOS PC Workstation Owner Beta.exe",
    ELECTRON / "node_modules",
    ROOT / "UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html",
    ROOT / "UAOS_PC_WORKSTATION_APP_V25.html",
    ROOT / "UAOS_PC_WORKSTATION_APP_V23.html",
]

checked_text_files = [
    ELECTRON / "START_ELECTRON_LOCAL_V29.cmd",
    ELECTRON / "SMOKE_TEST_ELECTRON_V29.cmd",
    ELECTRON / "ELECTRON_V29_WARNING_FIX_NOTES.md",
    ELECTRON / "ELECTRON_V29_SMOKE_TEST_README_AR.md",
    ELECTRON / "ELECTRON_V29_SMOKE_TEST_README_EN.md",
    GENERATED / "reports" / "V29_ELECTRON_WARNING_DIAGNOSIS.md",
    GENERATED / "reports" / "V29_ELECTRON_SMOKE_TEST_REPORT.md",
    GENERATED / "reports" / "V29_QA_REPORT.md",
    GENERATED / "10_final_seal" / "UAOS_PC_WORKSTATION_V29_ELECTRON_SMOKE_FINAL_SEAL.md",
]


def read_text(path):
    return path.read_text(encoding="utf-8", errors="ignore")


failures = []
warnings = []

for path in required_files:
    if not path.exists():
        failures.append(f"missing required file: {path}")

for path in required_paths:
    if not path.exists():
        failures.append(f"missing required local package/app path: {path}")

if (ROOT / "App.jsx").exists():
    failures.append("forbidden App.jsx surface exists in stable app root")

package_text = read_text(ELECTRON / "package.json")
if "--publish never" not in package_text:
    warnings.append("package:dir is not confirmed as publish-never")
if '"author"' not in package_text:
    warnings.append("package author field is still missing")

for path in checked_text_files:
    if not path.exists():
        continue
    text = read_text(path)
    lower = text.lower()
    audit_fix_is_negated = (
        "did not run npm audit fix" in lower
        or "npm audit fix was not run" in lower
    )
    if "npm audit fix" in lower and not audit_fix_is_negated:
        failures.append(f"unsafe audit fix instruction in {path}")
    if "installer created: yes" in lower or '"installer_created": "yes"' in lower:
        failures.append(f"installer creation claim found in {path}")
    if "deploy: yes" in lower or '"deploy": "yes"' in lower:
        failures.append(f"deploy claim found in {path}")
    if "payment: yes" in lower or '"payment": "yes"' in lower:
        failures.append(f"payment claim found in {path}")
    if "usb write: yes" in lower or '"usb_write": "yes"' in lower:
        failures.append(f"hardware write claim found in {path}")
    if "pa3x load: yes" in lower or '"pa3x_load": "yes"' in lower:
        failures.append(f"keyboard load claim found in {path}")
    if "fixture modification: yes" in lower:
        failures.append(f"fixture modification claim found in {path}")
    if "owner" + "-fixtures" in lower:
        failures.append(f"owner fixture path segment found in {path}")
    if "proprietary content copied: yes" in lower:
        failures.append(f"proprietary copy claim found in {path}")
    if "app.jsx touched: yes" in lower:
        failures.append(f"App.jsx touch claim found in {path}")
    if re.search(r"(?m)^\s*(copy|xcopy|robocopy)\b", lower):
        failures.append(f"copy command found in {path}")

status_path = ELECTRON / "ELECTRON_V29_PACKAGE_STATUS.json"
if status_path.exists():
    status = json.loads(read_text(status_path))
    if status.get("executable_found") != "YES":
        failures.append("package status does not confirm executable_found YES")
    if status.get("electron_executed") != "SKIPPED_WITH_REASON":
        failures.append("package status does not record skipped GUI execution")
    for key in [
        "installer_created",
        "deploy",
        "payment",
        "usb_write",
        "external_copy_outside_repo",
        "pa3x_load",
        "fixture_modification",
        "owner_fixture_access",
        "proprietary_content_copied",
        "app_jsx_touched",
    ]:
        if status.get(key) != "NO":
            failures.append(f"package status {key} is not NO")

forbidden_claims = [
    "PA3X" + "_READY",
    "USB" + "_READY",
    "DEPLOY" + "_READY",
    "PAYMENT" + "_READY",
]
for path in checked_text_files:
    if not path.exists():
        continue
    text = read_text(path)
    for claim in forbidden_claims:
        if claim in text:
            failures.append(f"forbidden readiness claim {claim} found in {path}")

result = {
    "status": "FAIL" if failures else ("WARN" if warnings else "PASS"),
    "base_commit": "118cf24",
    "deliverable": "ELECTRON_SMOKE_TEST_V29",
    "electron_workspace": str(ELECTRON),
    "local_package_folder": str(ELECTRON / "dist-local" / "win-unpacked"),
    "executable_found": "YES" if (ELECTRON / "dist-local" / "win-unpacked" / "UAOS PC Workstation Owner Beta.exe").exists() else "NO",
    "electron_executed": "SKIPPED_WITH_REASON",
    "installer_created": "NO",
    "deploy": "NO",
    "payment": "NO",
    "usb_write": "NO",
    "external_copy_outside_repo": "NO",
    "pa3x_load": "NO",
    "fixture_modification": "NO",
    "owner_fixture_access": "NO",
    "proprietary_content_copied": "NO",
    "app_jsx_touched": "NO",
    "warnings": warnings,
    "failures": failures,
}

(VALIDATOR / "VALIDATOR_V29_ELECTRON_SMOKE_RESULT.json").write_text(
    json.dumps(result, indent=2), encoding="utf-8"
)
print(json.dumps(result, indent=2))
