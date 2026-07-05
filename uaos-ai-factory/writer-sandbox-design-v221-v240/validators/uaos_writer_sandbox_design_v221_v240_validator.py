from pathlib import Path
import json, subprocess, sys
root=Path(r"E:\keyboard-manager-clean")
run=root/"uaos-ai-factory"/"writer-sandbox-design-v221-v240"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
required={
"architecture":run/"architecture"/"UAOS_WRITER_SANDBOX_ARCHITECTURE.json",
"boundaries":run/"sandbox-boundaries"/"UAOS_WRITER_SANDBOX_BOUNDARIES.md",
"io_contracts":run/"input-output-contracts"/"UAOS_WRITER_SANDBOX_OUTPUT_CONTRACT.json",
"data_mapping":run/"data-mapping"/"UAOS_STYLE_TO_WRITER_MAPPING_DRAFT.json",
"safety_locks":run/"safety-locks"/"UAOS_WRITER_SANDBOX_SAFETY_LOCKS.json",
"test_strategy":run/"test-strategy"/"UAOS_WRITER_SANDBOX_TEST_STRATEGY.md",
"owner_gates":run/"owner-gates"/"UAOS_OWNER_DECISION_FORM.md"}
for k,p in required.items(): check(k+"_exists", p.exists(), str(p))
react=load(run/"react-integration"/"UAOS_REACT_SANDBOX_STATUS_CARD.json")
check("react_build_pass_if_touched", (not react.get("appjsx_touched")) or react.get("build_pass") is True, str(react.get("build_pass")))
text=""
for f in run.rglob("*"):
    if f.name == "uaos_writer_sandbox_design_v221_v240_validator.py" or f.name == "UAOS_WRITER_SANDBOX_DESIGN_RULES.md": continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py",".jsx"}: text += f.read_text(encoding="utf-8", errors="ignore")+"\n"
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_generated_korg_output", not unsafe, ", ".join(unsafe))
check("no_sty_set_generated", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generated", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
check("no_payment_activation", "payment activation: yes" not in text.lower() and "payment_activation\": true" not in text.lower(), "no payment")
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
arch=load(run/"architecture"/"UAOS_WRITER_SANDBOX_ARCHITECTURE.json")
check("design_only", arch.get("implementation_status")=="DESIGN_ONLY" and arch.get("writer_code_created") is False and arch.get("real_korg_output_allowed") is False, "design only")
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
(run/"validators"/"UAOS_WRITER_SANDBOX_DESIGN_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
