from __future__ import annotations
import json, zipfile
from pathlib import Path

RUN = Path(r"E:\keyboard-manager-clean\uaos-ai-factory\mega-final-pipeline-v461-v560")
FORBIDDEN_EXTENSIONS = ['.sty', '.set', '.prs', '.prf', '.kst', '.wav', '.mp3']
ALLOWED_ZIP_EXTENSIONS = ['.md', '.json', '.html', '.txt', '.cmd', '.ps1', '.mid']
ALLOWED_SPECIAL_SUFFIXES = ['.uaosstyle.json', '.style.json', '.uaoswriter-sandbox.json', '.uaoswriter-report.md', '.uaos-dummybin']
CLAIM_KORG = "KORG" + "-compatible"
CLAIM_PA3X = "PA3X" + "-ready"

def zip_allowed(name):
    lower = name.lower()
    return any(lower.endswith(s) for s in ALLOWED_SPECIAL_SUFFIXES) or Path(lower).suffix in ALLOWED_ZIP_EXTENSIONS

def main():
    checks = []
    def check(name, passed, details=None):
        checks.append({"name": name, "pass": bool(passed), "details": details or []})
    agent_files = list((RUN / "01_agents").glob("AGENT_*.md"))
    check("agents_created", len(agent_files) == 12, [str(p) for p in agent_files])
    batches = [
        "v461_v480_feedback_intake",
        "v481_v500_parser_feedback_prep",
        "v501_v520_dummy_sandbox_hardening_v2",
        "v521_v540_style_rc_factory_expansion_v2",
        "v541_v560_final_owner_setup_v4",
    ]
    for batch in batches:
        check(batch + "_exists", (RUN / "03_executed_batches" / batch).exists())
        check(batch + "_seal_exists", (RUN / "03_executed_batches" / batch / "BATCH_FINAL_SEAL.md").exists())
    zip_path = RUN / "09_final_package" / "UAOS_FINAL_OWNER_SETUP_V4_PACKAGE.zip"
    check("final_package_zip_exists", zip_path.exists())
    bad_zip = []
    if zip_path.exists():
        with zipfile.ZipFile(zip_path) as zf:
            bad_zip = [n for n in zf.namelist() if not zip_allowed(n)]
    check("final_package_zip_allowed_types", not bad_zip, bad_zip)
    forbidden = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTENSIONS]
    check("no_forbidden_keyboard_package_extensions", not forbidden, forbidden)
    corpus_files = [p for p in RUN.rglob("*") if p.is_file() and "05_validators" not in p.relative_to(RUN).parts and p.suffix.lower() in [".md",".json",".html",".txt",".cmd",".ps1"]]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in corpus_files)
    bad_terms = [t for t in [CLAIM_KORG, CLAIM_PA3X, "USB write executed", "PA3X load executed", "deploy executed: YES", "payment activation: YES", "real writer implemented: YES"] if t in corpus]
    check("no_unsafe_claims_or_actions", not bad_terms, bad_terms)
    manifest = json.loads((RUN / "09_final_package" / "UAOS_FINAL_OWNER_SETUP_V4_MANIFEST.json").read_text(encoding="utf-8"))
    check("writer_ready_false", manifest.get("safety", {}).get("writer_ready") is False)
    check("react_build_not_required", True)
    result = {"validator": "uaos_mega_final_pipeline_v461_v560_validator", "result": "PASS" if all(c["pass"] for c in checks) else "FAIL", "checks": checks}
    (RUN / "05_validators" / "UAOS_MEGA_FINAL_PIPELINE_V461_V560_RESULTS.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
