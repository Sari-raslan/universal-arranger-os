from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "owner-test-setup-automation"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
check("launcher_exists", (run/"00_launcher"/"START_UAOS_OWNER_TEST.cmd").exists(), "launcher")
check("setup_helper_exists", (run/"01_setup"/"uaos_owner_test_setup.ps1").exists(), "helper")
check("owner_flow_dashboard_exists", (run/"02_owner_flow"/"UAOS_OWNER_TEST_FLOW_DASHBOARD.html").exists(), "dashboard")
check("link_index_exists", (run/"03_app_links"/"UAOS_OWNER_TEST_LINK_INDEX.json").exists(), "link index")
check("test_session_templates_exist", (run/"04_test_session"/"UAOS_OWNER_TEST_SESSION_TEMPLATE.md").exists() and (run/"04_test_session"/"UAOS_OWNER_TEST_SESSION_TEMPLATE.json").exists(), "templates")
status = json.loads((run/"01_setup"/"UAOS_OWNER_TEST_SETUP_STATUS.json").read_text(encoding="utf-8"))
check("build_pass", status.get("build_pass") is True, "npm run build")
check("local_url_or_fallback_recorded", bool(status.get("local_url")) or bool(status.get("fallback")), status.get("local_url", ""))
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("appjsx_unchanged", cp.stdout.strip() == "", cp.stdout.strip())
text = ""
for p in run.rglob("*"):
    if p.name == "uaos_owner_test_setup_automation_validator.py":
        continue
    if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".cmd",".ps1",".py"}:
        text += p.read_text(encoding="utf-8", errors="ignore") + "\n"
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
results["validator"] = "uaos_owner_test_setup_automation_validator.py"
(run/"05_validators"/"UAOS_OWNER_TEST_SETUP_AUTOMATION_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
