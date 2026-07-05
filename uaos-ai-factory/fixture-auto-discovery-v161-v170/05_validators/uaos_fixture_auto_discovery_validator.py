from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "fixture-auto-discovery-v161-v170"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")

def load_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

discovery_path = run / "01_discovery_results" / "UAOS_FIXTURE_DISCOVERY_RESULTS.json"
selection_path = run / "02_candidate_selection" / "UAOS_FIXTURE_CANDIDATE_SELECTION.json"
summary_path = run / "04_v161_v170_results" / "UAOS_V161_V170_FIXTURE_RESEARCH_SUMMARY.json"
check("discovery_script_exists", (run/"00_discovery_script"/"UAOS_FIND_OWNER_FIXTURE_CANDIDATES.ps1").exists(), "script")
check("discovery_results_exist", discovery_path.exists(), "discovery json")
check("candidate_selection_exists", selection_path.exists(), "selection json")
discovery = load_json(discovery_path) if discovery_path.exists() else {}
selection = load_json(selection_path) if selection_path.exists() else {}
summary = load_json(summary_path) if summary_path.exists() else {}
status = selection.get("status") or discovery.get("status")
count = int(selection.get("candidates_found_count", discovery.get("candidates_found_count", 0) or 0))
text = ""
for f in run.rglob("*"):
    if f.name == "uaos_fixture_auto_discovery_validator.py" or f.name == "UAOS_FIXTURE_AUTO_DISCOVERY_RULES.md":
        continue
    if f.is_file() and f.suffix.lower() in {".md", ".json", ".html", ".txt", ".ps1", ".py"}:
        text += f.read_text(encoding="utf-8", errors="ignore") + "\n"
check("metadata_only_discovery", discovery.get("discovery_mode") == "metadata_only", str(discovery.get("discovery_mode")))
check("no_fixture_copied", "fixture_copied\": true" not in text.lower() and not any(p.suffix.upper() in {".STY", ".SET", ".PRS", ".PRF", ".KST", ".PCG", ".PAD", ".SBD", ".KMP", ".KSF"} for p in run.rglob("*") if p.is_file()), "no fixture files in run folder")
writer_terms = ["function writeKorg", "class KorgWriter", "writeKorgFile(", "encodeKorgBinary("]
check("no_writer_implementation", not any(term in text for term in writer_terms), "no writer code")
unsafe = [str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty", ".set", ".prs", ".prf", ".kst"}]
check("no_generated_keyboard_outputs", not unsafe, ", ".join(unsafe))
check("no_usb", "usb_write\": true" not in text.lower() and "USB write: YES" not in text, "USB blocked")
check("no_pa3x_load", "pa3x_load\": true" not in text.lower() and "PA3X load: YES" not in text, "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
cp = subprocess.run(["git", "diff", "--name-only", "--", "uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("no_appjsx_change", cp.stdout.strip() == "", cp.stdout.strip())
claim1 = "KORG-" + "compatible"
claim2 = "PA3X-" + "ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
if count == 0:
    check("zero_candidate_status", status == "NO_FIXTURE_FOUND", str(status))
    check("zero_candidate_no_scan_pass_claim", summary.get("readonly_scan_completed") is False, "no scan")
elif count == 1:
    check("one_candidate_status", status == "ONE_CANDIDATE_SELECTED", str(status))
    check("one_candidate_hash_exists", (run/"03_readonly_scan"/"UAOS_SELECTED_FIXTURE_HASH_BASELINE.json").exists(), "hash")
    check("one_candidate_header_exists", (run/"03_readonly_scan"/"UAOS_SELECTED_FIXTURE_HEADER_SCAN.json").exists(), "header")
else:
    check("multiple_candidate_status", status == "OWNER_SELECTION_REQUIRED", str(status))
    check("multiple_candidate_no_scan_pass_claim", summary.get("readonly_scan_completed") is False, "no scan pass claim")
    check("multiple_candidate_top20", len(selection.get("top_20", [])) > 0, "top candidates listed")
results["status"] = "PASS" if not results["errors"] else "FAIL"
results["pass"] = not results["errors"]
results["candidate_status"] = status
results["candidates_found_count"] = count
(run/"05_validators"/"UAOS_FIXTURE_AUTO_DISCOVERY_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
