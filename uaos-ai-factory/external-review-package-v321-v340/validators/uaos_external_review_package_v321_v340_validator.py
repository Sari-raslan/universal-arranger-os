from pathlib import Path
import json, zipfile, subprocess, sys, re
RUN = Path(__file__).resolve().parents[1]
RESULT = RUN / "validators" / "UAOS_EXTERNAL_REVIEW_PACKAGE_V321_V340_RESULTS.json"
ZIP = RUN / "v331_external_review_zip" / "UAOS_V331_EXTERNAL_REVIEW_PACKAGE.zip"
FORBIDDEN = (".sty", ".set", ".prs", ".prf", ".kst")
ALLOWED = (".md", ".json", ".html", ".txt", ".uaoswriter-sandbox.json", ".uaoswriter-report.md", ".uaos-dummybin")
def exists(rel): return {"pass": (RUN / rel).exists(), "detail": str(RUN / rel)}
def read_json(rel): return json.loads((RUN / rel).read_text(encoding="utf-8"))
def run_v334():
    proc = subprocess.run([sys.executable, str(RUN / "v334_external_review_validator" / "uaos_v334_external_review_validator.py")], cwd=str(RUN), text=True, capture_output=True)
    try: data = read_json("v334_external_review_validator/UAOS_V334_EXTERNAL_REVIEW_VALIDATOR_RESULTS.json")
    except Exception: data = {"pass": False, "stderr": proc.stderr}
    return {"pass": data.get("pass") is True, "detail": data}
def all_stage_files_exist():
    required = ["v321_review_scope/UAOS_V321_EXTERNAL_REVIEW_SCOPE.md", "v322_reviewer_start_here/UAOS_V322_REVIEWER_START_HERE.md", "v323_technical_review_checklist/UAOS_V323_TECHNICAL_REVIEW_CHECKLIST.md", "v324_safety_review_checklist/UAOS_V324_SAFETY_REVIEW_CHECKLIST.md", "v325_dummy_writer_evidence_index/UAOS_V325_DUMMY_WRITER_EVIDENCE_INDEX.md", "v326_hardening_evidence_index/UAOS_V326_HARDENING_EVIDENCE_INDEX.md", "v327_reviewer_do_not_do/UAOS_V327_REVIEWER_DO_NOT_DO.md", "v328_feedback_forms/UAOS_V328_REVIEWER_FEEDBACK_FORM.md", "v329_owner_review_message/UAOS_V329_REVIEW_REQUEST_SUMMARY.md", "v330_external_package_manifest/UAOS_V330_EXTERNAL_REVIEW_PACKAGE_MANIFEST.json", "v331_external_review_zip/UAOS_V331_EXTERNAL_REVIEW_PACKAGE.zip", "v332_reviewer_dashboard/UAOS_V332_EXTERNAL_REVIEWER_DASHBOARD.html", "v333_review_risk_register/UAOS_V333_EXTERNAL_REVIEW_RISK_REGISTER.md", "v334_external_review_validator/uaos_v334_external_review_validator.py", "v335_owner_decision_gate/UAOS_V335_EXTERNAL_REVIEW_OWNER_DECISION_GATE.md", "v336_external_review_summary/UAOS_V336_EXTERNAL_REVIEW_SUMMARY.md", "v337_react_status_card/UAOS_V337_REACT_STATUS_CARD_RESULT.json", "v338_batch_qa_report/UAOS_V338_BATCH_QA_REPORT.md", "v339_batch_owner_dashboard/UAOS_V339_BATCH_OWNER_DASHBOARD.html", "v340_final_external_review_seal/UAOS_V340_FINAL_EXTERNAL_REVIEW_SEAL.md"]
    missing = [r for r in required if not (RUN / r).exists()]
    return {"pass": not missing, "detail": missing or "all V321-V340 files"}
def zip_allowed():
    bad=[]; fixtures=[]
    if not ZIP.exists(): return {"pass": False, "detail": "missing zip"}
    with zipfile.ZipFile(ZIP,"r") as zf:
        for name in zf.namelist():
            lower=name.lower()
            if not lower.endswith(ALLOWED): bad.append(name)
            if lower.endswith(FORBIDDEN): bad.append(name)
            if "fixture" in lower or "owner-fixtures" in lower: fixtures.append(name)
    return {"pass": not bad and not fixtures, "detail": {"bad": bad, "fixtures": fixtures}}
def no_forbidden_files():
    hits=[str(p.relative_to(RUN)) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN]
    return {"pass": not hits, "detail": hits or "none"}
def no_false_claims():
    terms=["KORG"+"-compatible", "PA3X"+"-ready"]
    hits=[]
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
            t=p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in t: hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "absent"}
def no_unsafe_positive_actions():
    patterns=[r"Real writer implemented:\s*YES", r"Real keyboard output:\s*YES", r"USB write:\s*YES", r"PA3X load:\s*YES", r"Deploy:\s*YES", r"Payment activation:\s*YES"]
    hits=[]
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
            t=p.read_text(encoding="utf-8", errors="ignore")
            for pat in patterns:
                if re.search(pat,t,re.IGNORECASE): hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "no unsafe positive actions"}
def react_build_pass_if_touched():
    data=read_json("v337_react_status_card/UAOS_V337_REACT_STATUS_CARD_RESULT.json")
    if not data.get("react_touched"): return {"pass": True, "detail": "not touched"}
    return {"pass": data.get("build_pass") is True, "detail": data.get("build_pass")}
checks={"agent_integration_exists": exists("agent-outputs/UAOS_V321_V340_AGENT_INTEGRATION_MAP.json"), "v321_v340_files_exist": all_stage_files_exist(), "external_review_zip_exists": exists("v331_external_review_zip/UAOS_V331_EXTERNAL_REVIEW_PACKAGE.zip"), "zip_contains_only_allowed_types": zip_allowed(), "v334_validator_pass": run_v334(), "react_build_pass_if_touched": react_build_pass_if_touched(), "no_real_writer_implementation": no_unsafe_positive_actions(), "no_generated_korg_output": no_forbidden_files(), "no_sty_set_generated": no_forbidden_files(), "no_prs_prf_kst_generated": no_forbidden_files(), "no_usb_pa3x_deploy_payment_positive_action": no_unsafe_positive_actions(), "no_exact_false_claims": no_false_claims()}
errors=[k for k,v in checks.items() if not v["pass"]]
result={"checks":checks,"errors":errors,"status":"PASS" if not errors else "FAIL","pass":not errors}
RESULT.write_text(json.dumps(result,indent=2),encoding="utf-8")
print(json.dumps(result,indent=2))
raise SystemExit(0 if not errors else 1)
