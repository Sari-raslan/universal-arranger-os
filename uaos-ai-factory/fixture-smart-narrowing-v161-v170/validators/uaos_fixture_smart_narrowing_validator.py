from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "fixture-smart-narrowing-v161-v170"
source = root / "uaos-ai-factory" / "fixture-auto-discovery-v161-v170"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(path): return json.loads(path.read_text(encoding="utf-8-sig"))
discovery_path=source/"01_discovery_results"/"UAOS_FIXTURE_DISCOVERY_RESULTS.json"
check("discovery_input_exists", discovery_path.exists(), str(discovery_path))
discovery=load(discovery_path) if discovery_path.exists() else {}
orig=int(discovery.get("candidates_found_count",0) or 0)
top100=run/"ranking"/"UAOS_FIXTURE_TOP_100_RANKED.json"
top20=run/"ranking"/"UAOS_FIXTURE_TOP_20_OWNER_REVIEW.md"
top10=run/"ranking"/"UAOS_FIXTURE_TOP_10_RECOMMENDED.md"
top3=run/"ranking"/"UAOS_FIXTURE_TOP_3_RECOMMENDED.json"
form=run/"owner-selection"/"UAOS_FIXTURE_OWNER_SELECTION_FORM.md"
check("candidates_found_count_preserved", orig == 2409, str(orig))
check("top_100_created", top100.exists() and len(load(top100).get("items",[])) == min(100, orig), "top100")
check("top_20_created", top20.exists(), "top20")
check("top_10_created", top10.exists(), "top10")
check("top_3_created", top3.exists() and len(load(top3).get("items",[])) == 3, "top3")
check("owner_selection_form_created", form.exists(), "form")
text=""
for f in run.rglob("*"):
    if f.name == "uaos_fixture_smart_narrowing_validator.py" or f.name == "UAOS_FIXTURE_SMART_NARROWING_RULES.md":
        continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py"}:
        text += f.read_text(encoding="utf-8", errors="ignore") + "\n"
fixture_exts={".sty",".set",".prs",".prf",".kst",".pcg",".pad",".sbd",".kmp",".ksf"}
fixture_files=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in fixture_exts]
check("no_fixture_copied", not fixture_files, ", ".join(fixture_files))
check("no_content_scan", "content_scan\": true" not in text.lower() and "scan_executed: YES" not in text, "no scan")
check("no_hash_all_candidates", "hash_all_candidates\": true" not in text.lower(), "no all-candidate hash")
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_generated_keyboard_outputs", not unsafe, ", ".join(unsafe))
check("no_usb", "usb_write: yes" not in text.lower() and "usb write: yes" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x_load: yes" not in text.lower() and "pa3x load: yes" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
cp=subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("no_appjsx_change", cp.stdout.strip()=="", cp.stdout.strip())
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
results["original_candidates_count"]=orig
(run/"validators"/"UAOS_FIXTURE_SMART_NARROWING_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
