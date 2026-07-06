from __future__ import annotations
import json, zipfile
from pathlib import Path

RUN = Path(r"E:\keyboard-manager-clean\uaos-ai-factory\final-owner-setup-v3-v381-v400")
APP = Path(r"E:\keyboard-manager-clean\uaos-live-clean")
FORBIDDEN_EXTENSIONS = ['.sty', '.set', '.prs', '.prf', '.kst', '.wav', '.mp3']
ALLOWED_ZIP_EXTENSIONS = ['.md', '.json', '.html', '.txt', '.cmd', '.ps1', '.mid']
ALLOWED_SPECIAL_SUFFIXES = ['.uaosstyle.json', '.style.json', '.uaoswriter-sandbox.json', '.uaoswriter-report.md', '.uaos-dummybin']
CLAIM_KORG = "KORG" + "-compatible"
CLAIM_PA3X = "PA3X" + "-ready"
REQUIRED = ['agent-outputs/UAOS_V381_V400_AGENT_HANDOFF_SUMMARY.md', 'agent-outputs/UAOS_V381_V400_AGENT_INTEGRATION_MAP.json', 'agents/AGENT_04_OWNER_TEST_SETUP_V3_INTEGRATED.md', 'agents/AGENT_08_REACT_PRODUCT_UI_INTEGRATED.md', 'agents/AGENT_09_RELEASE_LOCAL_PACKAGE_INTEGRATED.md', 'agents/AGENT_10_FINAL_INTEGRATOR_INTEGRATED.md', 'agents/AGENT_11_SAFETY_GOVERNANCE_INTEGRATED.md', 'agents/AGENT_12_ROADMAP_MANAGER_INTEGRATED.md', 'dashboards/UAOS_FINAL_OWNER_SETUP_V3_OWNER_DASHBOARD.html', 'dashboards/UAOS_FINAL_OWNER_SETUP_V3_V381_V400_DASHBOARD.html', 'logs/UAOS_FINAL_OWNER_SETUP_V3_V381_V400_LOG.txt', 'reports/UAOS_FINAL_OWNER_SETUP_V3_V381_V400_EXECUTIVE_SUMMARY.md', 'reports/UAOS_FINAL_OWNER_SETUP_V3_V381_V400_QA_REPORT.md', 'seal/UAOS_FINAL_OWNER_SETUP_V3_V381_V400_FINAL_SEAL.md', 'v381_setup_scope/UAOS_V381_FINAL_OWNER_SETUP_V3_SCOPE.json', 'v381_setup_scope/UAOS_V381_FINAL_OWNER_SETUP_V3_SCOPE.md', 'v382_one_launcher_v3/START_UAOS_FINAL_OWNER_SETUP_V3.cmd', 'v382_one_launcher_v3/START_UAOS_FINAL_OWNER_SETUP_V3.ps1', 'v382_one_launcher_v3/UAOS_V382_ONE_LAUNCHER_V3_README_AR.md', 'v382_one_launcher_v3/UAOS_V382_ONE_LAUNCHER_V3_README_EN.md', 'v383_owner_app_index_v3/UAOS_V383_OWNER_APP_INDEX_V3.html', 'v383_owner_app_index_v3/UAOS_V383_OWNER_APP_INDEX_V3.json', 'v383_owner_app_index_v3/UAOS_V383_OWNER_APP_START_HERE.md', 'v384_local_package_v3/UAOS_V384_LOCAL_PACKAGE_V3_CONTENTS.md', 'v384_local_package_v3/UAOS_V384_LOCAL_PACKAGE_V3_FILE_INDEX.json', 'v384_local_package_v3/UAOS_V384_LOCAL_PACKAGE_V3_MANIFEST.json', 'v385_dashboard_index/UAOS_V385_DASHBOARD_INDEX.html', 'v385_dashboard_index/UAOS_V385_DASHBOARD_INDEX.json', 'v385_dashboard_index/UAOS_V385_DASHBOARD_INDEX_README.md', 'v386_style_rc_factory_links/UAOS_V386_STYLE_RC_FACTORY_LINKS.json', 'v386_style_rc_factory_links/UAOS_V386_STYLE_RC_FACTORY_LINKS.md', 'v387_parser_research_links/UAOS_V387_PARSER_RESEARCH_LINKS.json', 'v387_parser_research_links/UAOS_V387_PARSER_RESEARCH_LINKS.md', 'v388_dummy_sandbox_links/UAOS_V388_DUMMY_SANDBOX_LINKS.json', 'v388_dummy_sandbox_links/UAOS_V388_DUMMY_SANDBOX_LINKS.md', 'v389_external_review_links/UAOS_V389_EXTERNAL_REVIEW_LINKS.json', 'v389_external_review_links/UAOS_V389_EXTERNAL_REVIEW_LINKS.md', 'v390_owner_decision_center/UAOS_V390_OWNER_DECISION_CENTER.html', 'v390_owner_decision_center/UAOS_V390_OWNER_DECISION_CENTER.md', 'v390_owner_decision_center/UAOS_V390_OWNER_DECISION_FORM.json', 'v391_safety_evidence_center/UAOS_V391_SAFETY_EVIDENCE_CENTER.html', 'v391_safety_evidence_center/UAOS_V391_SAFETY_EVIDENCE_INDEX.json', 'v391_safety_evidence_center/UAOS_V391_SAFETY_EVIDENCE_SUMMARY.md', 'v392_react_final_status/UAOS_V392_REACT_FINAL_STATUS_RESULT.json', 'v392_react_final_status/UAOS_V392_REACT_FINAL_STATUS_RESULT.md', 'v393_owner_test_session_v3/UAOS_V393_OWNER_TEST_SESSION_V3_QUICK_AR.md', 'v393_owner_test_session_v3/UAOS_V393_OWNER_TEST_SESSION_V3_QUICK_EN.md', 'v393_owner_test_session_v3/UAOS_V393_OWNER_TEST_SESSION_V3_TEMPLATE.json', 'v393_owner_test_session_v3/UAOS_V393_OWNER_TEST_SESSION_V3_TEMPLATE.md', 'v395_release_notes_local_only/UAOS_V395_FINAL_OWNER_SETUP_V3_RELEASE_NOTES.md', 'v396_final_qa_evidence/UAOS_V396_FINAL_QA_EVIDENCE.json', 'v396_final_qa_evidence/UAOS_V396_FINAL_QA_EVIDENCE.md', 'v397_final_owner_dashboard/UAOS_V397_FINAL_OWNER_DASHBOARD.html', 'v398_final_technical_dashboard/UAOS_V398_FINAL_TECHNICAL_DASHBOARD.html', 'v399_master_executive_summary/UAOS_V399_MASTER_EXECUTIVE_SUMMARY.md', 'v400_master_executive_seal/UAOS_V400_MASTER_EXECUTIVE_SEAL.md']

def load_json(rel):
    return json.loads((RUN / rel).read_text(encoding="utf-8"))

def zip_allowed(name):
    lower = name.lower()
    return any(lower.endswith(s) for s in ALLOWED_SPECIAL_SUFFIXES) or Path(lower).suffix in ALLOWED_ZIP_EXTENSIONS

def main():
    checks = []
    missing = [rel for rel in REQUIRED if not (RUN / rel).exists()]
    checks.append({"name": "v381_v400_files_exist", "pass": not missing, "details": missing})
    for rel in [
        "v382_one_launcher_v3/START_UAOS_FINAL_OWNER_SETUP_V3.cmd",
        "v382_one_launcher_v3/START_UAOS_FINAL_OWNER_SETUP_V3.ps1",
        "v383_owner_app_index_v3/UAOS_V383_OWNER_APP_INDEX_V3.html",
        "v390_owner_decision_center/UAOS_V390_OWNER_DECISION_CENTER.html",
        "v391_safety_evidence_center/UAOS_V391_SAFETY_EVIDENCE_CENTER.html",
        "v394_local_package_zip/UAOS_V394_FINAL_OWNER_SETUP_V3_PACKAGE.zip",
    ]:
        checks.append({"name": rel.replace("/", "_") + "_exists", "pass": (RUN / rel).exists()})
    forbidden_files = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTENSIONS]
    checks.append({"name": "no_forbidden_keyboard_or_media_extensions", "pass": not forbidden_files, "details": forbidden_files})
    zip_path = RUN / "v394_local_package_zip" / "UAOS_V394_FINAL_OWNER_SETUP_V3_PACKAGE.zip"
    bad_zip = []
    if zip_path.exists():
        with zipfile.ZipFile(zip_path) as zf:
            bad_zip = [n for n in zf.namelist() if not zip_allowed(n)]
    checks.append({"name": "zip_contains_only_allowed_types", "pass": not bad_zip, "details": bad_zip})
    corpus_files = [
        p for p in RUN.rglob("*")
        if p.is_file()
        and "validators" not in p.relative_to(RUN).parts
        and p.suffix.lower() in [".md", ".json", ".html", ".txt", ".cmd", ".ps1"]
    ]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in corpus_files)
    forbidden_terms = [term for term in [CLAIM_KORG, CLAIM_PA3X, "USB write executed", "PA3X load executed", "deploy executed: YES", "payment activation: YES", "real writer implemented: YES"] if term in corpus]
    checks.append({"name": "no_unsafe_claims_or_executed_actions", "pass": not forbidden_terms, "details": forbidden_terms})
    scope = load_json("v381_setup_scope/UAOS_V381_FINAL_OWNER_SETUP_V3_SCOPE.json")
    react = load_json("v392_react_final_status/UAOS_V392_REACT_FINAL_STATUS_RESULT.json")
    checks.append({"name": "writer_ready_false", "pass": scope.get("safety", {}).get("writer_ready") is False})
    if react.get("app_jsx_touched") is True:
        checks.append({"name": "react_build_pass_if_touched", "pass": react.get("build_pass") is True})
        checks.append({"name": "app_jsx_backup_exists_if_touched", "pass": Path(react.get("app_jsx_backup", "")).exists()})
    else:
        checks.append({"name": "react_build_not_required", "pass": True})
    result = {
        "validator": "uaos_final_owner_setup_v3_v381_v400_validator",
        "batch": "V381-V400",
        "result": "PASS" if all(c.get("pass") for c in checks) else "FAIL",
        "checks": checks,
    }
    (RUN / "validators" / "UAOS_FINAL_OWNER_SETUP_V3_V381_V400_RESULTS.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
