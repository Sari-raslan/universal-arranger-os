from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "owner-test-launcher-repair"
setup = root / "uaos-ai-factory" / "owner-test-setup-automation"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
status = json.loads((setup / "01_setup" / "UAOS_OWNER_TEST_SETUP_STATUS.json").read_text(encoding="utf-8-sig"))
probe = json.loads((run / "diagnosis" / "UAOS_LOCAL_URL_PROBE_RESULTS.json").read_text(encoding="utf-8"))
repair = json.loads((run / "repair" / "UAOS_OWNER_TEST_LAUNCHER_REPAIR_RESULT.json").read_text(encoding="utf-8"))
check("build_pass", status.get("build_pass") is True, "npm run build")
check("url_probe_completed", bool(probe.get("probe_results")), "probe results recorded")
check("working_url_or_diagnostic_recorded", bool(status.get("working_url")) or bool(status.get("errors")), status.get("working_url", ""))
check("launcher_repaired", repair.get("launcher_repaired") is True, "launcher")
check("setup_helper_repaired", repair.get("setup_helper_repaired") is True, "helper")
check("old_url_not_only_option", status.get("working_url") != "http://127.0.0.1:4173/universal-arranger-os/" and len(status.get("candidate_urls", [])) > 1, status.get("working_url", ""))
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("appjsx_unchanged", cp.stdout.strip() == "", cp.stdout.strip())
text = ""
scan_files = [
    setup / "00_launcher" / "START_UAOS_OWNER_TEST.cmd",
    setup / "01_setup" / "uaos_owner_test_setup.ps1",
    setup / "01_setup" / "UAOS_OWNER_TEST_SETUP_STATUS.json",
    setup / "01_setup" / "UAOS_OWNER_TEST_SETUP_CONFIG.json",
    setup / "03_app_links" / "UAOS_LOCAL_APP_URLS.md",
]
for f in run.rglob("*"):
    scan_files.append(f)
for f in scan_files:
    if f.exists():
        if f.name == "uaos_owner_test_launcher_repair_validator.py":
            continue
        if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".cmd",".ps1",".py"}:
            text += f.read_text(encoding="utf-8", errors="ignore") + "\n"
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
check("no_push", "git push" not in text.lower(), "no push commands")
check("korg_writer_blocked", "KORG Writer: BLOCKED" in text or "korg_writer" in text, "blocked state recorded")
unsafe = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_blocked_korg_files_in_run_folder", not unsafe, ", ".join(unsafe))
check("no_usb_pa3x_payment", "USB: YES" not in text and "PA3X: YES" not in text and "payment activation: YES" not in text, "blocked actions absent")
claim1 = "KORG-" + "compatible"
claim2 = "PA3X-" + "ready"
check("no_false_claim_strings", claim1 not in text and claim2 not in text, "claim strings absent")
results["pass"] = not results["errors"]
results["validator"] = "uaos_owner_test_launcher_repair_validator.py"
(run / "validators" / "UAOS_OWNER_TEST_LAUNCHER_REPAIR_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
