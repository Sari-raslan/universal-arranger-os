from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "vercel-deploy-retry-slim"
app_ignore = root / "uaos-live-clean" / ".vercelignore"
project_json = root / "uaos-live-clean" / ".vercel" / "project.json"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
check("app_vercelignore_exists", app_ignore.exists(), str(app_ignore))
project = json.loads(project_json.read_text(encoding="utf-8")) if project_json.exists() else {}
check("linked_project_confirmed", project.get("projectName") == "sari-raslan-universal-arranger-os", project.get("projectName", ""))
build = json.loads((run / "deploy-retry" / "UAOS_SLIM_DEPLOY_BUILD_CHECK.json").read_text(encoding="utf-8"))
check("build_pass", build.get("build_pass") is True, "npm run build")
deploy = json.loads((run / "deploy-retry" / "UAOS_VERCEL_SLIM_DEPLOY_RESULT.json").read_text(encoding="utf-8"))
check("deploy_retry_executed", deploy.get("deploy_executed") is True, "deploy command started")
check("public_url_recorded", bool(deploy.get("deployment_url")), deploy.get("deployment_url", ""))
check("public_ready_confirmed", deploy.get("public_url_ready_confirmed") is True, deploy.get("vercel_status", ""))
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("appjsx_unchanged", cp.stdout.strip() == "", cp.stdout.strip())
text = ""
for p in run.rglob("*"):
    if p.name == "uaos_vercel_deploy_retry_slim_validator.py":
        continue
    if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
        text += p.read_text(encoding="utf-8", errors="ignore") + "\n"
check("no_product_rewrite", "App.jsx changed in this run: YES" not in text, "no app code rewrite recorded")
check("korg_writer_blocked", "KORG Writer: BLOCKED" in text or "korg_writer" in text, "blocked state recorded")
unsafe = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_blocked_korg_files_in_run_folder", not unsafe, ", ".join(unsafe))
check("no_usb_pa3x_payment", "USB: YES" not in text and "PA3X: YES" not in text and "payment activation: YES" not in text, "blocked actions absent")
check("no_false_claim_strings", "KORG-compatible" not in text and "PA3X-ready" not in text, "exact false claim strings absent")
results["pass"] = not results["errors"]
results["validator"] = "uaos_vercel_deploy_retry_slim_validator.py"
(run / "validators" / "UAOS_VERCEL_DEPLOY_RETRY_SLIM_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
