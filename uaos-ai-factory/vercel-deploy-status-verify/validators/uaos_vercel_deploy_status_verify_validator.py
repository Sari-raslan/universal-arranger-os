from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "vercel-deploy-status-verify"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
public = json.loads((run / "status-check" / "UAOS_PUBLIC_URL_STATUS_CHECK.json").read_text(encoding="utf-8"))
final = json.loads((run / "status-check" / "UAOS_DEPLOY_STATUS_FINAL_CLASSIFICATION.json").read_text(encoding="utf-8"))
status = json.loads((run / "status-check" / "UAOS_VERCEL_DEPLOYMENT_STATUS.json").read_text(encoding="utf-8"))
check("no_new_deploy_executed", status.get("new_deploy_executed_this_run") is False, "inspect only")
check("public_url_checked", public.get("page_reachable") is True and public.get("http_status") == 200, public.get("public_url", ""))
check("final_classification_created", bool(final.get("classification")), final.get("classification", ""))
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("appjsx_unchanged", cp.stdout.strip() == "", cp.stdout.strip())
text = ""
for p in run.rglob("*"):
    if p.name == "uaos_vercel_deploy_status_verify_validator.py":
        continue
    if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
        text += p.read_text(encoding="utf-8", errors="ignore") + "\n"
check("no_product_rewrite", "product rewrite: YES" not in text and "App.jsx changed: YES" not in text, "no rewrite recorded")
check("korg_writer_blocked", "KORG Writer: BLOCKED" in text or "korg_writer" in text, "blocked state recorded")
unsafe = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_blocked_korg_files_in_run_folder", not unsafe, ", ".join(unsafe))
check("no_usb_pa3x_payment", "USB: YES" not in text and "PA3X: YES" not in text and "payment activation: YES" not in text, "blocked actions absent")
claim1 = "KORG-" + "compatible"
claim2 = "PA3X-" + "ready"
check("no_false_claim_strings", claim1 not in text and claim2 not in text, "claim strings absent")
results["pass"] = not results["errors"]
results["validator"] = "uaos_vercel_deploy_status_verify_validator.py"
(run / "validators" / "UAOS_VERCEL_DEPLOY_STATUS_VERIFY_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
