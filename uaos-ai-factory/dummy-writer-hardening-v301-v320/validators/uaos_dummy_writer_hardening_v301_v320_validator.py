from pathlib import Path
import json, subprocess, sys, re
RUN = Path(__file__).resolve().parents[1]
RESULT = RUN / "validators" / "UAOS_DUMMY_WRITER_HARDENING_V301_V320_RESULTS.json"
FORBIDDEN_EXTS = (".sty", ".set", ".prs", ".prf", ".kst")

def exists(rel):
    p = RUN / rel
    return {"pass": p.exists(), "detail": str(p)}

def read_json(rel):
    return json.loads((RUN / rel).read_text(encoding="utf-8"))

def run_v307():
    proc = subprocess.run([sys.executable, str(RUN / "v307_dummy_output_validator_v2" / "uaos_v307_dummy_output_validator_v2.py")], cwd=str(RUN), text=True, capture_output=True)
    try:
        data = read_json("v307_dummy_output_validator_v2/UAOS_V307_DUMMY_OUTPUT_VALIDATOR_V2_RESULTS.json")
    except Exception:
        data = {"pass": False, "status": "FAIL", "stderr": proc.stderr}
    return {"pass": data.get("pass") is True, "detail": data}

def all_stage_files_exist():
    required = ["v301_dummy_output_audit_v2/UAOS_V301_DUMMY_OUTPUT_AUDIT_V2.json", "v302_extension_blocker_stress_v2/UAOS_V302_EXTENSION_BLOCKER_STRESS_V2.json", "v303_false_claim_scanner_v2/UAOS_V303_FALSE_CLAIM_SCANNER_V2.json", "v304_no_hardware_runtime_lock_v2/UAOS_V304_NO_HARDWARE_RUNTIME_LOCK_V2.json", "v305_dummy_output_manifest_v2/UAOS_V305_DUMMY_OUTPUT_MANIFEST_V2.json", "v306_sandbox_runner_hardening/UAOS_V306_SANDBOX_RUNNER_HARDENING.json", "v307_dummy_output_validator_v2/uaos_v307_dummy_output_validator_v2.py", "v308_dummy_sandbox_ui_status/UAOS_V308_DUMMY_SANDBOX_UI_STATUS.json", "v309_external_review_handoff_prep/UAOS_V309_EXTERNAL_REVIEW_HANDOFF_PREP.md", "v310_dummy_sandbox_hardening_seal/UAOS_V310_DUMMY_SANDBOX_HARDENING_SEAL.md", "v311_additional_extension_stress/UAOS_V311_ADDITIONAL_EXTENSION_STRESS.md", "v312_forbidden_path_stress/UAOS_V312_FORBIDDEN_PATH_STRESS.md", "v313_marker_integrity_stress/UAOS_V313_MARKER_INTEGRITY_STRESS.md", "v314_report_only_policy_check/UAOS_V314_REPORT_ONLY_POLICY_CHECK.md", "v315_sandbox_regression_pack/UAOS_V315_SANDBOX_REGRESSION_PACK.md", "v316_owner_hardening_dashboard/UAOS_V316_OWNER_HARDENING_DASHBOARD.html", "v317_external_review_readiness_check/UAOS_V317_EXTERNAL_REVIEW_READINESS_CHECK.md", "v318_next_gate_options/UAOS_V318_NEXT_GATE_OPTIONS.md", "v319_batch_hardening_summary/UAOS_V319_BATCH_HARDENING_SUMMARY.md", "v320_final_hardening_seal/UAOS_V320_FINAL_HARDENING_SEAL.md"]
    missing = [rel for rel in required if not (RUN / rel).exists()]
    return {"pass": not missing, "detail": missing or "all V301-V320 files"}

def no_forbidden_files():
    hits = [str(p.relative_to(RUN)) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTS]
    return {"pass": not hits, "detail": hits or "none"}

def no_false_claims():
    terms = ["KORG" + "-compatible", "PA3X" + "-ready"]
    hits = []
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}:
            continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in t:
                    hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "absent"}

def no_unsafe_positive_actions():
    patterns = [r"real writer implemented:\s*YES", r"real keyboard output:\s*YES", r"USB write:\s*YES", r"PA3X load:\s*YES", r"Deploy:\s*YES", r"Payment activation:\s*YES"]
    hits = []
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}:
            continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            for pat in patterns:
                if re.search(pat, t, re.IGNORECASE):
                    hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "no unsafe positive actions"}

def react_build_pass_if_touched():
    data = read_json("v308_dummy_sandbox_ui_status/UAOS_V308_DUMMY_SANDBOX_UI_STATUS.json")
    if not data.get("react_touched"):
        return {"pass": True, "detail": "not touched"}
    return {"pass": data.get("build_pass") is True, "detail": data.get("build_pass")}

checks = {"agent_integration_exists": exists("agent-outputs/UAOS_V301_V320_AGENT_INTEGRATION_MAP.json"), "v301_v320_files_exist": all_stage_files_exist(), "dummy_output_audit_pass": {"pass": read_json("v301_dummy_output_audit_v2/UAOS_V301_DUMMY_OUTPUT_AUDIT_V2.json").get("pass") is True, "detail": read_json("v301_dummy_output_audit_v2/UAOS_V301_DUMMY_OUTPUT_AUDIT_V2.json").get("status")}, "extension_blocker_stress_pass": {"pass": read_json("v302_extension_blocker_stress_v2/UAOS_V302_EXTENSION_BLOCKER_STRESS_V2.json").get("pass") is True, "detail": read_json("v302_extension_blocker_stress_v2/UAOS_V302_EXTENSION_BLOCKER_STRESS_V2.json").get("status")}, "false_claim_scanner_pass": {"pass": read_json("v303_false_claim_scanner_v2/UAOS_V303_FALSE_CLAIM_SCANNER_V2.json").get("pass") is True, "detail": read_json("v303_false_claim_scanner_v2/UAOS_V303_FALSE_CLAIM_SCANNER_V2.json").get("status")}, "no_hardware_runtime_lock_pass": {"pass": read_json("v304_no_hardware_runtime_lock_v2/UAOS_V304_NO_HARDWARE_RUNTIME_LOCK_V2.json").get("pass") is True, "detail": read_json("v304_no_hardware_runtime_lock_v2/UAOS_V304_NO_HARDWARE_RUNTIME_LOCK_V2.json").get("status")}, "validator_v2_pass": run_v307(), "react_build_pass_if_touched": react_build_pass_if_touched(), "no_real_writer_implementation": no_unsafe_positive_actions(), "no_generated_korg_output": no_forbidden_files(), "no_sty_set_generated": no_forbidden_files(), "no_prs_prf_kst_generated": no_forbidden_files(), "no_usb_pa3x_deploy_payment_positive_action": no_unsafe_positive_actions(), "no_exact_false_claims": no_false_claims()}
errors = [k for k,v in checks.items() if not v["pass"]]
result = {"checks": checks, "errors": errors, "status": "PASS" if not errors else "FAIL", "pass": not errors}
RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if not errors else 1)
