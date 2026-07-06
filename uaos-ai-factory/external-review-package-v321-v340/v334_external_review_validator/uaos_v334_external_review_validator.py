from pathlib import Path
import json, zipfile
RUN = Path(__file__).resolve().parents[1]
ZIP = RUN / "v331_external_review_zip" / "UAOS_V331_EXTERNAL_REVIEW_PACKAGE.zip"
RESULT = RUN / "v334_external_review_validator" / "UAOS_V334_EXTERNAL_REVIEW_VALIDATOR_RESULTS.json"
ALLOWED = (".md", ".json", ".html", ".txt", ".uaoswriter-sandbox.json", ".uaoswriter-report.md", ".uaos-dummybin")
FORBIDDEN = (".sty", ".set", ".prs", ".prf", ".kst", ".wav", ".mp3")

def exists(rel): return (RUN / rel).exists()
def main():
    required = ["v321_review_scope/UAOS_V321_EXTERNAL_REVIEW_SCOPE.md", "v325_dummy_writer_evidence_index/UAOS_V325_DUMMY_WRITER_EVIDENCE_INDEX.json", "v328_feedback_forms/UAOS_V328_REVIEWER_FEEDBACK_FORM.md", "v327_reviewer_do_not_do/UAOS_V327_REVIEWER_DO_NOT_DO.md"]
    missing = [r for r in required if not exists(r)]
    bad = []
    fixture = []
    if ZIP.exists():
        with zipfile.ZipFile(ZIP, "r") as zf:
            for name in zf.namelist():
                lower = name.lower()
                if not lower.endswith(ALLOWED): bad.append(name)
                if lower.endswith(FORBIDDEN): bad.append(name)
                if "fixture" in lower or "owner-fixtures" in lower: fixture.append(name)
                if "usb" in lower and (lower.endswith(".cmd") or lower.endswith(".ps1")): bad.append(name)
                if "pa3x" in lower and (lower.endswith(".cmd") or lower.endswith(".ps1")): bad.append(name)
    terms = ["KORG" + "-compatible", "PA3X" + "-ready"]
    claim_hits = []
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in t: claim_hits.append(str(p.relative_to(RUN)))
    result = {"review_docs_exist": not missing, "evidence_indexes_exist": exists("v325_dummy_writer_evidence_index/UAOS_V325_DUMMY_WRITER_EVIDENCE_INDEX.json") and exists("v326_hardening_evidence_index/UAOS_V326_HARDENING_EVIDENCE_INDEX.json"), "feedback_forms_exist": exists("v328_feedback_forms/UAOS_V328_REVIEWER_FEEDBACK_FORM.md"), "do_not_do_exists": exists("v327_reviewer_do_not_do/UAOS_V327_REVIEWER_DO_NOT_DO.md"), "zip_exists": ZIP.exists(), "zip_allowed_only": not bad, "no_owner_fixture_files": not fixture, "no_false_claims": not claim_hits, "errors": missing + bad + fixture + claim_hits}
    result["status"] = "PASS" if all(v for k, v in result.items() if k not in {"errors", "status"}) else "FAIL"
    result["pass"] = result["status"] == "PASS"
    RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1
if __name__ == "__main__": raise SystemExit(main())
