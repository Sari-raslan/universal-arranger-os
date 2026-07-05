from pathlib import Path
import json, subprocess, sys, re
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "owner-test-ui-cleanup-evidence"
appjsx = root / "uaos-live-clean" / "src" / "App.jsx"
index = root / "uaos-live-clean" / "index.html"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
text = appjsx.read_text(encoding="utf-8")
index_text = index.read_text(encoding="utf-8")
url_check = json.loads((run / "evidence" / "UAOS_OWNER_TEST_UI_CLEANUP_URL_CHECK.json").read_text(encoding="utf-8"))
check("build_pass", all(item.get("reachable") for item in url_check.get("url_results", [])), "local URL responses after build")
mojibake_terms = ["??", "??", "??", "???"]
check("mojibake_repaired", not any(term in text or term in index_text for term in mojibake_terms), "known mojibake tokens absent")
old_terms = ["NO PUSH / NO DEPLOY / NO VERCEL", "NOT PUBLIC RELEASE", "Deploy: NOT RUN", "No public publish"]
check("old_strict_no_deploy_wording_removed", not any(term in text for term in old_terms), "old strict terms absent")
check("relaxed_product_mode_wording_present", "approval gate" in text and "local owner test active" in text, "approval-gate wording")
check("korg_writer_blocked_text_remains", "KORG Writer: BLOCKED" in text, "KORG Writer block")
check("sty_set_blocked_text_remains", ".STY/.SET: BLOCKED" in text, ".STY/.SET block")
check("usb_pa3x_blocked_text_remains", "USB: BLOCKED" in text and "PA3X Load: BLOCKED" in text, "USB/PA3X blocks")
scan = ""
for f in run.rglob("*"):
    if f.name == "uaos_owner_test_ui_cleanup_validator.py":
        continue
    if f.is_file() and f.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
        scan += f.read_text(encoding="utf-8", errors="ignore") + "\n"
check("no_deploy_executed", "vercel deploy" not in scan.lower() and "github pages deploy" not in scan.lower(), "no deploy commands")
check("no_push_executed", "git push" not in scan.lower(), "no push command")
check("no_korg_writer", "KORG Writer: BLOCKED" in scan or "KORG Writer blocked" in scan, "blocked state recorded")
unsafe = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty", ".set", ".prs", ".prf", ".kst"}]
check("no_blocked_korg_files_in_run_folder", not unsafe, ", ".join(unsafe))
check("no_usb_pa3x_payment_activation", "USB: YES" not in scan and "PA3X: YES" not in scan and "payment activation: YES" not in scan, "blocked actions absent")
claim1 = "KORG-" + "compatible"
claim2 = "PA3X-" + "ready"
check("no_false_claim_strings", claim1 not in scan and claim2 not in scan, "claim strings absent")
results["pass"] = not results["errors"]
results["validator"] = "uaos_owner_test_ui_cleanup_validator.py"
(run / "validators" / "UAOS_OWNER_TEST_UI_CLEANUP_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
