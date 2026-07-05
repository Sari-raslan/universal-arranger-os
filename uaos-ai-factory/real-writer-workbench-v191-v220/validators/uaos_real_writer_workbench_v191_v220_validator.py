from pathlib import Path
import json, subprocess, sys
root=Path(r"E:\keyboard-manager-clean")
run=root/"uaos-ai-factory"/"real-writer-workbench-v191-v220"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
check("rank1_input_exists", (root/"uaos-ai-factory"/"fixture-rank1-readonly-scan-v161-v170"/"02_hash_baseline"/"UAOS_RANK_1_HASH_BASELINE.json").exists(), "rank1")
for rank in [2,3]:
    ver=load(run/f"rank{rank}-scan"/f"UAOS_RANK{rank}_PATH_VERIFICATION.json")
    check(f"rank{rank}_handled_safely", ver.get("status") in ["PASS", f"RANK{rank}_MISSING"], ver.get("status"))
check("comparison_report_exists", (run/"rank-comparison"/"UAOS_RANK1_RANK2_RANK3_COMPARISON.json").exists(), "comparison")
conf=load(run/"parser-confidence"/"UAOS_WRITER_READINESS_SCORE.json")
check("parser_confidence_v4_exists", (run/"parser-confidence"/"UAOS_PARSER_CONFIDENCE_MATRIX_V4.json").exists(), "v4")
check("writer_workbench_files_exist", (run/"writer-workbench"/"UAOS_REAL_WRITER_WORKBENCH_SPEC.md").exists() and (run/"writer-workbench"/"UAOS_REAL_WRITER_WORKBENCH_INDEX.json").exists(), "workbench")
check("owner_gates_exist", (run/"owner-gates"/"UAOS_WRITER_SANDBOX_APPROVAL_GATE.md").exists() and (run/"owner-gates"/"UAOS_NEXT_OWNER_DECISION_FORM.md").exists(), "gates")
react=load(run/"react-integration"/"UAOS_REACT_WORKBENCH_INTEGRATION_STATUS.json")
check("react_build_pass_if_touched", (not react.get("appjsx_touched")) or react.get("build_pass") is True, str(react.get("build_pass")))
text=""
for f in run.rglob("*"):
    if f.name == "uaos_real_writer_workbench_v191_v220_validator.py" or f.name == "UAOS_REAL_WRITER_WORKBENCH_V191_V220_RULES.md": continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py",".jsx"}: text += f.read_text(encoding="utf-8", errors="ignore")+"\n"
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_fixture_copied", not unsafe, ", ".join(unsafe))
large=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt"} and p.stat().st_size > 1048576]
check("no_full_fixture_dump", not large, ", ".join(large))
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
check("no_generated_korg_output", not unsafe, ", ".join(unsafe))
check("no_sty_set_generation", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generation", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
check("no_payment_activation", "payment activation: yes" not in text.lower() and "payment_activation\": true" not in text.lower(), "no payment")
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
check("writer_ready_false", conf.get("writer_ready") is False, str(conf.get("writer_ready")))
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
(run/"validators"/"UAOS_REAL_WRITER_WORKBENCH_V191_V220_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
