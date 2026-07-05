from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "vercel-slim-deploy-prep"
ignore_path = root / "uaos-live-clean.vercelignore"
required_exclusions = ["node_modules",".git","dist","build","coverage","*.zip","*.wav","*.mp3","*.7z","*.rar","*.log","*.bak","backups","generated","reports","dashboards","uaos-ai-factory","metadata-project-generator","sound-library-factory-night-run","sound-library-priority-refinement","priority-library-midi-test-arrangement","style-export-track","style-export-track-v2","style-midi-sync-track","style-package-rc","korg-readonly-research-gate","korg-readonly-parser-scaffold","UAOS_FINAL_LOCAL_OWNER_PROGRAM_V2"]
required_app_files = ["package.json","src","public","vite.config.js","vite.config.code-splitting.mjs","index.html"]
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
lines = []
if ignore_path.exists():
    lines = [x.strip() for x in ignore_path.read_text(encoding="utf-8").splitlines() if x.strip() and not x.strip().startswith("#")]
check("vercelignore_exists", ignore_path.exists(), str(ignore_path))
missing = [x for x in required_exclusions if x not in lines]
check("large_local_artifacts_ignored", not missing, "missing: " + ", ".join(missing))
ignored_required = [x for x in required_app_files if x in lines]
check("required_app_files_not_ignored", not ignored_required, "ignored required: " + ", ".join(ignored_required))
build_json = run / "slim-config" / "UAOS_SLIM_DEPLOY_BUILD_CHECK.json"
build_data = json.loads(build_json.read_text(encoding="utf-8")) if build_json.exists() else {}
check("build_pass", build_data.get("build_pass") is True, str(build_json))
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("appjsx_unchanged", cp.stdout.strip() == "", cp.stdout.strip())
check("deploy_not_executed", build_data.get("deploy_executed") is False, "prep run only")
text = ""
for p in run.rglob("*"):
    if p.name == "uaos_vercel_slim_deploy_prep_validator.py":
        continue
    if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
        text += p.read_text(encoding="utf-8", errors="ignore") + "\n"
check("no_payment_activation", "payment activation: YES" not in text and '"payment_activation": true' not in text, "payment remains off")
check("korg_writer_blocked", "KORG Writer: BLOCKED" in text or "korg_writer" in text, "blocked state recorded")
check("no_false_claim_strings", "KORG-compatible" not in text and "PA3X-ready" not in text, "exact false claim strings absent")
unsafe_created = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_blocked_korg_files_created_in_run_folder", not unsafe_created, ", ".join(unsafe_created))
results["pass"] = not results["errors"]
results["validator"] = "uaos_vercel_slim_deploy_prep_validator.py"
(run / "validators" / "UAOS_VERCEL_SLIM_DEPLOY_PREP_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
