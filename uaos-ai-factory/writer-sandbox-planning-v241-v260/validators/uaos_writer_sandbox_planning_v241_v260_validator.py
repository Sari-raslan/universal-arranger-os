from pathlib import Path
import json, sys
root=Path(r"E:\keyboard-manager-clean")
run=root/"uaos-ai-factory"/"writer-sandbox-planning-v241-v260"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
check("implementation_plan_exists", (run/"implementation-plan"/"UAOS_WRITER_SANDBOX_IMPLEMENTATION_PLAN.json").exists(), "implementation")
check("contracts_exist", (run/"sandbox-contracts"/"UAOS_SANDBOX_INPUT_CONTRACT_V2.json").exists() and (run/"sandbox-contracts"/"UAOS_SANDBOX_OUTPUT_CONTRACT_V2.json").exists(), "contracts")
check("dummy_output_spec_exists", (run/"dummy-output-format"/"UAOS_DUMMY_OUTPUT_FORMAT_SPEC.md").exists(), "dummy spec")
dummy_json=run/"dummy-output-format"/"UAOS_DUMMY_OUTPUT_EXAMPLE.uaoswriter-sandbox.json"
dummy_bin=run/"dummy-output-format"/"UAOS_DUMMY_OUTPUT_EXAMPLE.uaos-dummybin"
check("dummy_output_example_allowed_extensions", dummy_json.exists() and dummy_bin.exists(), "dummy examples")
marker="NOT_KORG_OUTPUT_DO_NOT_LOAD"
check("dummy_output_marker_present", marker in dummy_json.read_text(encoding="utf-8") and marker in dummy_bin.read_text(encoding="ascii"), "marker")
check("mapping_plan_exists", (run/"mapping-engine-plan"/"UAOS_STYLE_TO_DUMMY_WRITER_MAPPING_PLAN.json").exists(), "mapping")
check("runtime_safety_lock_plan_exists", (run/"safety-lock-runtime-plan"/"UAOS_RUNTIME_SAFETY_LOCK_PLAN.json").exists(), "runtime locks")
check("owner_gates_exist", (run/"owner-gates"/"UAOS_OWNER_NEXT_DECISION_FORM.md").exists(), "owner gates")
react=load(run/"react-integration"/"UAOS_REACT_SANDBOX_PLANNING_STATUS.json")
check("react_build_pass_if_touched", (not react.get("appjsx_touched")) or react.get("build_pass") is True, str(react.get("build_pass")))
text=""
for f in run.rglob("*"):
    if f.name == "uaos_writer_sandbox_planning_v241_v260_validator.py" or f.name == "UAOS_WRITER_SANDBOX_PLANNING_RULES.md": continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py"} or f.name.endswith(".uaos-dummybin"):
        text += f.read_text(encoding="utf-8", errors="ignore")+"\n"
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_real_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_generated_korg_output", not unsafe, ", ".join(unsafe))
check("no_sty_set_generated", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generated", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy")
check("no_payment_activation", "payment activation: yes" not in text.lower() and "payment_activation\": true" not in text.lower(), "no payment")
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
impl=load(run/"implementation-plan"/"UAOS_WRITER_SANDBOX_IMPLEMENTATION_PLAN.json")
check("planning_only", impl.get("implementation_status")=="PLANNING_ONLY" and impl.get("real_writer_implemented") is False and impl.get("korg_output_allowed") is False, "planning only")
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
(run/"validators"/"UAOS_WRITER_SANDBOX_PLANNING_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
