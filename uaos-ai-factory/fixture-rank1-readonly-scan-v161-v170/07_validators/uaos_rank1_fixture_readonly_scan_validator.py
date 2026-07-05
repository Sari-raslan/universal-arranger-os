from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "fixture-rank1-readonly-scan-v161-v170"
smart = root / "uaos-ai-factory" / "fixture-smart-narrowing-v161-v170" / "ranking" / "UAOS_FIXTURE_TOP_3_RECOMMENDED.json"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
top3=load(smart); rank1=next((x for x in top3.get("items",[]) if int(x.get("rank",0))==1), {})
sel=load(run/"00_rank_selection"/"UAOS_RANK_1_SELECTION_RECORD.json")
ver=load(run/"01_path_verification"/"UAOS_RANK_1_PATH_VERIFICATION.json")
summary=load(run/"05_research_summary"/"UAOS_RANK_1_FIXTURE_RESEARCH_SUMMARY.json")
check("rank_1_selected_from_top3", sel.get("selected_path")==rank1.get("path") and sel.get("selected_rank")==1, sel.get("selected_path"))
check("owner_approval_recorded", "read-only scan only" in sel.get("owner_approval_text","") and sel.get("read_only") is True, "approval")
check("path_exists", ver.get("path_exists") is True and ver.get("is_file") is True and ver.get("readable") is True, ver.get("path"))
check("read_only_scan_completed", summary.get("read_only_scan_completed") is True, "scan")
check("hash_baseline_exists", (run/"02_hash_baseline"/"UAOS_RANK_1_HASH_BASELINE.json").exists(), "hash")
header_path=run/"03_header_scan"/"UAOS_RANK_1_HEADER_SCAN.json"
check("bounded_header_scan_exists", header_path.exists() and load(header_path).get("bytes_read",999999) <= 4096, "header")
check("unknown_chunk_scan_exists", (run/"04_unknown_chunk_scan"/"UAOS_RANK_1_UNKNOWN_CHUNK_SCAN.json").exists(), "unknown")
text=""
for f in run.rglob("*"):
    if f.name == "uaos_rank1_fixture_readonly_scan_validator.py" or f.name == "UAOS_RANK1_FIXTURE_READONLY_SCAN_RULES.md":
        continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py"}:
        text += f.read_text(encoding="utf-8", errors="ignore") + "\n"
large=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt"} and p.stat().st_size > 1048576]
check("no_full_file_dump", not large, ", ".join(large))
fixture_exts={".sty",".set",".prs",".prf",".kst"}
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in fixture_exts]
check("no_fixture_copied", not unsafe, ", ".join(unsafe))
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
check("no_korg_output_generated", not unsafe, ", ".join(unsafe))
check("no_sty_set_generated", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generated", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
cp=subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("no_appjsx_change", cp.stdout.strip()=="", cp.stdout.strip())
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
results["selected_path"]=sel.get("selected_path")
(run/"07_validators"/"UAOS_RANK1_FIXTURE_READONLY_SCAN_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
