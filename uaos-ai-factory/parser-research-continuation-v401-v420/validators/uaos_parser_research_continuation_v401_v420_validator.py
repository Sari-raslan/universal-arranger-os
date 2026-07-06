from __future__ import annotations
import json
from pathlib import Path
RUN = Path(r"E:\keyboard-manager-clean\uaos-ai-factory\parser-research-continuation-v401-v420")
FORBIDDEN_EXTENSIONS = ['.sty', '.set', '.prs', '.prf', '.kst']
CLAIM_KORG = "KORG" + "-compatible"
CLAIM_PA3X = "PA3X" + "-ready"
REQUIRED = ['schema-v6/UAOS_V406_READONLY_PARSER_SCHEMA_V6.json', 'schema-v6/UAOS_V407_PARSER_OUTPUT_SCHEMA_V6.md', 'schema-v6/UAOS_V408_SCHEMA_V5_TO_V6_CHANGELOG.md', 'confidence-v6/UAOS_V409_PARSER_CONFIDENCE_MATRIX_V6.md', 'confidence-v6/UAOS_V410_PARSER_CONFIDENCE_MATRIX_V6.json', 'confidence-v6/UAOS_V411_WRITER_READINESS_SCORE_V6.md', 'fixture-strategy/UAOS_V412_NEXT_FIXTURE_STRATEGY.md', 'fixture-strategy/UAOS_V413_REQUIRED_FIXTURE_TYPES.json', 'fixture-strategy/UAOS_V414_FIXTURE_SELECTION_GUIDE.md', 'fixture-strategy/UAOS_V415_FIXTURE_OWNER_APPROVAL_FORM.md', 'writer-readiness/UAOS_V416_WRITER_READINESS_REVIEW.md', 'writer-readiness/UAOS_V417_WRITER_BLOCKERS_LIST.json', 'writer-readiness/UAOS_V418_SAFE_NEXT_GATE.md', 'dashboards/UAOS_PARSER_RESEARCH_CONTINUATION_V401_V420_DASHBOARD.html', 'dashboards/UAOS_PARSER_RESEARCH_CONTINUATION_OWNER_DASHBOARD.html', 'seal/UAOS_V420_PARSER_RESEARCH_CONTINUATION_FINAL_SEAL.md']
def load(rel):
    return json.loads((RUN / rel).read_text(encoding="utf-8"))
def main():
    checks = []
    missing = [r for r in REQUIRED if not (RUN / r).exists()]
    checks.append({"name":"required_outputs_exist","pass":not missing,"details":missing})
    forbidden_files = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTENSIONS]
    checks.append({"name":"no_forbidden_keyboard_package_extensions","pass":not forbidden_files,"details":forbidden_files})
    corpus_files = [p for p in RUN.rglob("*") if p.is_file() and "validators" not in p.relative_to(RUN).parts and p.suffix.lower() in [".md",".json",".html",".txt"]]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in corpus_files)
    terms = [t for t in [CLAIM_KORG, CLAIM_PA3X, "USB write executed", "PA3X load executed", "deploy executed: YES", "payment activation: YES", "real writer implemented: YES"] if t in corpus]
    checks.append({"name":"no_unsafe_claims_or_actions","pass":not terms,"details":terms})
    schema = load("schema-v6/UAOS_V406_READONLY_PARSER_SCHEMA_V6.json")
    matrix = load("confidence-v6/UAOS_V410_PARSER_CONFIDENCE_MATRIX_V6.json")
    blockers = load("writer-readiness/UAOS_V417_WRITER_BLOCKERS_LIST.json")
    checks.append({"name":"writer_ready_false","pass":schema.get("writer_ready") is False and matrix.get("writer_ready") is False and blockers.get("writer_ready") is False})
    checks.append({"name":"real_writer_allowed_false","pass":schema.get("real_writer_allowed") is False and matrix.get("real_writer_allowed") is False and blockers.get("real_writer_allowed") is False})
    react = load("react-status/UAOS_V419_REACT_STATUS_CARD_RESULT.json")
    if react.get("app_jsx_touched") is True:
        checks.append({"name":"react_build_pass_if_touched","pass":react.get("build_pass") is True})
        checks.append({"name":"app_jsx_backup_exists_if_touched","pass":Path(react.get("app_jsx_backup","")).exists()})
    else:
        checks.append({"name":"react_build_not_required","pass":True})
    result = {"validator":"uaos_parser_research_continuation_v401_v420_validator","batch":"V401-V420","result":"PASS" if all(c.get("pass") for c in checks) else "FAIL","checks":checks}
    (RUN / "validators" / "UAOS_PARSER_RESEARCH_CONTINUATION_V401_V420_RESULTS.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS" else 1
if __name__ == "__main__":
    raise SystemExit(main())
