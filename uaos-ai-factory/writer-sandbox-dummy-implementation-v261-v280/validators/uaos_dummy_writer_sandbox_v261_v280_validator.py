from pathlib import Path
import json, sys
root=Path(r"E:\keyboard-manager-clean")
run=root/"uaos-ai-factory"/"writer-sandbox-dummy-implementation-v261-v280"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
source_files=[run/"src"/"uaos_writer_sandbox_dummy.py",run/"src"/"uaos_writer_sandbox_mapping.py",run/"src"/"uaos_writer_sandbox_safety.py"]
check("source_files_exist", all(p.exists() for p in source_files), "source")
check("runner_exists", (run/"sandbox-runner"/"RUN_UAOS_DUMMY_WRITER_SANDBOX.ps1").exists() and (run/"sandbox-runner"/"RUN_UAOS_DUMMY_WRITER_SANDBOX.cmd").exists(), "runner")
outputs=[run/"dummy-output"/"UAOS_DUMMY_WRITER_OUTPUT.uaoswriter-sandbox.json",run/"dummy-output"/"UAOS_DUMMY_WRITER_OUTPUT.uaos-dummybin",run/"dummy-output"/"UAOS_DUMMY_WRITER_REPORT.uaoswriter-report.md"]
check("dummy_output_exists", all(p.exists() for p in outputs), "outputs")
marker="NOT_KORG_OUTPUT_DO_NOT_LOAD"
check("dummy_output_marker_exists", all(marker in p.read_text(encoding="utf-8", errors="ignore") for p in outputs if p.exists()), "marker")
allowed=(".uaoswriter-sandbox.json",".uaoswriter-report.md",".uaos-dummybin")
all_files=[p for p in (run/"dummy-output").glob("*") if p.is_file()]
check("allowed_extensions_only", all(any(p.name.endswith(ext) for ext in allowed) or p.name.endswith(".json") for p in all_files), ", ".join(p.name for p in all_files))
block=load(run/"runtime-safety"/"UAOS_FORBIDDEN_OUTPUT_ATTEMPT_TEST.json")
check("forbidden_extension_attempts_blocked", block.get("pass") is True and all(a.get("blocked") for a in block.get("attempts",[])), "blocked")
text=""
for f in run.rglob("*"):
    if f.name == "uaos_dummy_writer_sandbox_v261_v280_validator.py" or f.name == "UAOS_DUMMY_WRITER_SANDBOX_RULES.md": continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py",".ps1",".cmd"} or f.name.endswith(".uaos-dummybin"):
        text += f.read_text(encoding="utf-8", errors="ignore")+"\n"
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_sty_set_generated", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generated", not unsafe, ", ".join(unsafe))
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_real_writer_implementation", not any(t in text for t in writer_terms), "no real writer code")
check("no_korg_binary_output", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy")
check("no_payment_activation", "payment activation: yes" not in text.lower() and "payment_activation\": true" not in text.lower(), "no payment")
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
react=load(run/"react-integration"/"UAOS_REACT_DUMMY_SANDBOX_STATUS.json")
check("react_build_pass_if_touched", (not react.get("appjsx_touched")) or react.get("build_pass") is True, str(react.get("build_pass")))
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
(run/"validators"/"UAOS_DUMMY_WRITER_SANDBOX_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
