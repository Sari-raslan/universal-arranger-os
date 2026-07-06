from __future__ import annotations
import json
from pathlib import Path

RUN = Path(r"E:\keyboard-manager-clean\uaos-ai-factory\parser-research-factory-v361-v380")
APP = Path(r"E:\keyboard-manager-clean\uaos-live-clean")
FORBIDDEN_EXTENSIONS = ['.sty', '.set', '.prs', '.prf', '.kst']
CLAIM_KORG = "KORG" + "-compatible"
CLAIM_PA3X = "PA3X" + "-ready"
REQUIRED = ['agents/AGENT_06_PARSER_RESEARCH_FACTORY_INTEGRATED.md', 'agents/AGENT_03_VALIDATOR_STRESS_INTEGRATED.md', 'agents/AGENT_07_WRITER_SANDBOX_GATEKEEPER_INTEGRATED.md', 'agents/AGENT_10_FINAL_INTEGRATOR_INTEGRATED.md', 'agents/AGENT_11_SAFETY_GOVERNANCE_INTEGRATED.md', 'agent-outputs/UAOS_V361_V380_AGENT_INTEGRATION_MAP.json', 'agent-outputs/UAOS_V361_V380_AGENT_HANDOFF_SUMMARY.md', 'v361_research_factory_scope/UAOS_V361_RESEARCH_FACTORY_SCOPE.md', 'v361_research_factory_scope/UAOS_V361_RESEARCH_FACTORY_SCOPE.json', 'v362_rank_evidence_import/UAOS_V362_RANK_EVIDENCE_IMPORT.md', 'v362_rank_evidence_import/UAOS_V362_RANK_EVIDENCE_IMPORT.json', 'v363_rank_comparison_v2/UAOS_V363_RANK_COMPARISON_V2.md', 'v363_rank_comparison_v2/UAOS_V363_RANK_COMPARISON_V2.json', 'v364_common_header_model_v3/UAOS_V364_COMMON_HEADER_MODEL_V3.md', 'v364_common_header_model_v3/UAOS_V364_COMMON_HEADER_MODEL_V3.json', 'v365_unknown_region_catalog_v3/UAOS_V365_UNKNOWN_REGION_CATALOG_V3.md', 'v365_unknown_region_catalog_v3/UAOS_V365_UNKNOWN_REGION_CATALOG_V3.json', 'v366_section_mapping_confidence/UAOS_V366_SECTION_MAPPING_CONFIDENCE.md', 'v366_section_mapping_confidence/UAOS_V366_SECTION_MAPPING_CONFIDENCE.json', 'v367_track_mapping_confidence/UAOS_V367_TRACK_MAPPING_CONFIDENCE.md', 'v367_track_mapping_confidence/UAOS_V367_TRACK_MAPPING_CONFIDENCE.json', 'v368_parser_schema_v5/UAOS_V368_READONLY_PARSER_SCHEMA_V5.json', 'v368_parser_schema_v5/UAOS_V368_PARSER_OUTPUT_SCHEMA_V5.md', 'v368_parser_schema_v5/UAOS_V368_SCHEMA_V4_TO_V5_CHANGELOG.md', 'v369_parser_confidence_matrix_v5/UAOS_V369_PARSER_CONFIDENCE_MATRIX_V5.md', 'v369_parser_confidence_matrix_v5/UAOS_V369_PARSER_CONFIDENCE_MATRIX_V5.json', 'v370_fixture_requirements_v2/UAOS_V370_FIXTURE_REQUIREMENTS_V2.md', 'v370_fixture_requirements_v2/UAOS_V370_FIXTURE_REQUIREMENTS_V2.json', 'v371_writer_readiness_gate_v2/UAOS_V371_WRITER_READINESS_GATE_V2.md', 'v371_writer_readiness_gate_v2/UAOS_V371_WRITER_READINESS_GATE_V2.json', 'v372_research_risk_register/UAOS_V372_RESEARCH_RISK_REGISTER.md', 'v372_research_risk_register/UAOS_V372_RESEARCH_RISK_REGISTER.json', 'v373_report_generator_spec_v2/UAOS_V373_REPORT_GENERATOR_SPEC_V2.md', 'v373_report_generator_spec_v2/UAOS_V373_REPORT_GENERATOR_SPEC_V2.json', 'v374_parser_output_viewer_spec/UAOS_V374_PARSER_OUTPUT_VIEWER_SPEC.md', 'v374_parser_output_viewer_spec/UAOS_V374_PARSER_OUTPUT_VIEWER_SPEC.json', 'v375_owner_research_dashboard/UAOS_V375_OWNER_RESEARCH_DASHBOARD.html', 'v375_owner_research_dashboard/UAOS_V375_OWNER_RESEARCH_DASHBOARD.md', 'v376_external_research_review_pack/UAOS_V376_EXTERNAL_RESEARCH_REVIEW_PACK.md', 'v376_external_research_review_pack/UAOS_V376_EXTERNAL_RESEARCH_REVIEW_PACK.json', 'v377_react_status_card/UAOS_V377_REACT_STATUS_CARD_RESULT.md', 'v377_react_status_card/UAOS_V377_REACT_STATUS_CARD_RESULT.json', 'v378_batch_qa_report/UAOS_V378_BATCH_QA_REPORT.md', 'v378_batch_qa_report/UAOS_V378_BATCH_QA_REPORT.json', 'v379_batch_owner_dashboard/UAOS_V379_BATCH_OWNER_DASHBOARD.md', 'v379_batch_owner_dashboard/UAOS_V379_BATCH_OWNER_DASHBOARD.json', 'v380_final_parser_research_factory_seal/UAOS_V380_FINAL_PARSER_RESEARCH_FACTORY_SEAL.md', 'dashboards/UAOS_PARSER_RESEARCH_FACTORY_V361_V380_DASHBOARD.html', 'dashboards/UAOS_PARSER_RESEARCH_OWNER_DASHBOARD.html', 'reports/UAOS_PARSER_RESEARCH_FACTORY_V361_V380_QA_REPORT.md', 'reports/UAOS_PARSER_RESEARCH_FACTORY_V361_V380_EXECUTIVE_SUMMARY.md', 'logs/UAOS_PARSER_RESEARCH_FACTORY_V361_V380_LOG.txt', 'seal/UAOS_PARSER_RESEARCH_FACTORY_V361_V380_FINAL_SEAL.md']

def load_json(rel):
    return json.loads((RUN / rel).read_text(encoding="utf-8"))

def main():
    checks = []
    missing = [rel for rel in REQUIRED if not (RUN / rel).exists()]
    checks.append({"name": "required_files_exist", "pass": not missing, "details": missing})
    forbidden_files = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTENSIONS]
    checks.append({"name": "no_forbidden_keyboard_package_extensions", "pass": not forbidden_files, "details": forbidden_files})
    corpus_files = [
        p for p in RUN.rglob("*")
        if p.is_file()
        and "validators" not in p.relative_to(RUN).parts
        and p.suffix.lower() in [".md", ".json", ".html", ".txt"]
    ]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in corpus_files)
    forbidden_terms = [term for term in [CLAIM_KORG, CLAIM_PA3X, "USB write executed", "PA3X load executed", "deploy executed: YES", "payment activation: YES"] if term in corpus]
    checks.append({"name": "no_unsafe_claims_or_actions", "pass": not forbidden_terms, "details": forbidden_terms})
    schema = load_json("v368_parser_schema_v5/UAOS_V368_READONLY_PARSER_SCHEMA_V5.json")
    matrix = load_json("v369_parser_confidence_matrix_v5/UAOS_V369_PARSER_CONFIDENCE_MATRIX_V5.json")
    gate = load_json("v371_writer_readiness_gate_v2/UAOS_V371_WRITER_READINESS_GATE_V2.json")
    checks.append({"name": "writer_ready_false", "pass": schema.get("writer_ready") is False and matrix.get("writer_ready") is False and gate.get("writer_ready") is False})
    checks.append({"name": "real_writer_allowed_false", "pass": schema.get("real_writer_allowed") is False and matrix.get("real_writer_allowed") is False and gate.get("real_writer_allowed") is False})
    section = load_json("v366_section_mapping_confidence/UAOS_V366_SECTION_MAPPING_CONFIDENCE.json")
    track = load_json("v367_track_mapping_confidence/UAOS_V367_TRACK_MAPPING_CONFIDENCE.json")
    section_ok = all(row.get("state") in ["UNKNOWN", "UNCONFIRMED", "HYPOTHESIS"] and row.get("solved") is False for row in section.get("sections", []))
    track_ok = all(row.get("state") in ["UNKNOWN", "UNCONFIRMED", "HYPOTHESIS"] and row.get("solved") is False for row in track.get("tracks", []))
    checks.append({"name": "unproven_mappings_remain_unsolved", "pass": section_ok and track_ok})
    react = load_json("v377_react_status_card/UAOS_V377_REACT_STATUS_CARD_RESULT.json")
    if react.get("app_jsx_touched") is True:
        checks.append({"name": "react_build_pass_if_touched", "pass": react.get("build_pass") is True})
        checks.append({"name": "app_jsx_backup_exists_if_touched", "pass": Path(react.get("app_jsx_backup", "")).exists()})
    else:
        checks.append({"name": "react_build_not_required", "pass": True})
    result = {
        "validator": "uaos_parser_research_factory_v361_v380_validator",
        "batch": "V361-V380",
        "result": "PASS" if all(c.get("pass") for c in checks) else "FAIL",
        "checks": checks,
    }
    out = RUN / "validators" / "UAOS_PARSER_RESEARCH_FACTORY_V361_V380_RESULTS.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
