from pathlib import Path
import json, zipfile, re

RUN = Path(__file__).resolve().parents[1]
RESULT = RUN / "validators" / "UAOS_DUMMY_WRITER_EXTERNAL_REVIEW_RESULTS.json"
ALLOWED_ZIP_ENDINGS = (".md", ".json", ".html", ".txt", ".uaoswriter-sandbox.json", ".uaoswriter-report.md", ".uaos-dummybin")
FORBIDDEN_EXTS = (".sty", ".set", ".prs", ".prf", ".kst", ".wav", ".mp3")

def read_json(rel):
    return json.loads((RUN / rel).read_text(encoding="utf-8"))

def exists(rel):
    p = RUN / rel
    return {"pass": p.exists(), "detail": str(p)}

def no_files_with_forbidden_ext():
    hits = []
    for p in RUN.rglob("*"):
        if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTS:
            hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "none"}

def zip_allowed():
    z = RUN / "external-package" / "UAOS_DUMMY_WRITER_EXTERNAL_REVIEW_PACKAGE.zip"
    if not z.exists():
        return {"pass": False, "detail": "missing zip"}
    bad = []
    with zipfile.ZipFile(z, "r") as zf:
        for name in zf.namelist():
            lower = name.lower()
            if not lower.endswith(ALLOWED_ZIP_ENDINGS):
                bad.append(name)
            if lower.endswith(FORBIDDEN_EXTS):
                bad.append(name)
    return {"pass": not bad, "detail": bad or "allowed"}

def marker_pass():
    audit = read_json("dummy-output-audit/UAOS_DUMMY_OUTPUT_AUDIT_REPORT.json")
    ok = audit.get("marker_in_json") and audit.get("marker_in_dummybin") and audit.get("status") == "PASS"
    return {"pass": bool(ok), "detail": "PASS" if ok else audit}

def stress_pass():
    data = read_json("validator-stress/UAOS_EXTENSION_BLOCKER_STRESS_TEST.json")
    attempts = data.get("extension_attempts", []) + data.get("destination_attempts", []) + data.get("claim_attempts", [])
    ok = data.get("status") == "PASS" and all(a.get("result") == "BLOCKED" for a in attempts) and all(not a.get("file_created", False) for a in attempts)
    ok = ok and all(not a.get("claim_approved", False) for a in data.get("claim_attempts", []))
    return {"pass": bool(ok), "detail": data.get("status")}

def no_real_writer_code():
    terms = ["write" + "KorgFile", "generate" + "Sty", "generate" + "Set", "binary" + "KorgWriter", "real" + "KorgWriter"]
    hits = []
    for p in RUN.rglob("*"):
        if p == Path(__file__).resolve():
            continue
        if p.is_file() and p.suffix.lower() in {".py", ".js", ".jsx", ".ts", ".tsx"}:
            content = p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in content:
                    hits.append(f"{p.relative_to(RUN)}:{term}")
    return {"pass": not hits, "detail": hits or "no real writer code"}

def react_build_pass_if_touched():
    status = read_json("react-integration/UAOS_REACT_EXTERNAL_REVIEW_STATUS.json")
    if not status.get("app_jsx_touched"):
        return {"pass": True, "detail": "not touched"}
    return {"pass": status.get("build_pass") is True, "detail": status.get("build_pass")}

def no_positive_unsafe_actions():
    unsafe = []
    patterns = [r"claim_approved\"\s*:\s*true", r"real_writer\"\s*:\s*\"READY\"", r"deploy\"\s*:\s*\"RUN\"", r"payment\"\s*:\s*\"ACTIVE\""]
    for p in RUN.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".txt", ".html", ".py"}:
            content = p.read_text(encoding="utf-8", errors="ignore")
            for pat in patterns:
                if re.search(pat, content, re.IGNORECASE):
                    unsafe.append(str(p.relative_to(RUN)))
    return {"pass": not unsafe, "detail": unsafe or "no positive unsafe action"}

checks = {
    "external_review_docs_exist": exists("external-review/UAOS_EXTERNAL_REVIEW_START_HERE.md"),
    "dummy_output_audit_exists": exists("dummy-output-audit/UAOS_DUMMY_OUTPUT_AUDIT_REPORT.json"),
    "marker_check_pass": marker_pass(),
    "stress_test_reports_exist": exists("validator-stress/UAOS_EXTENSION_BLOCKER_STRESS_TEST.json"),
    "stress_test_pass": stress_pass(),
    "hardening_files_exist": exists("hardening/UAOS_RUNTIME_SAFETY_LOCKS_V2.json"),
    "owner_gate_exists": exists("owner-gates/UAOS_V300_OWNER_DECISION_GATE.json"),
    "external_review_zip_exists": exists("external-package/UAOS_DUMMY_WRITER_EXTERNAL_REVIEW_PACKAGE.zip"),
    "zip_contains_only_allowed_files": zip_allowed(),
    "react_build_pass_if_touched": react_build_pass_if_touched(),
    "no_real_writer_implementation": no_real_writer_code(),
    "no_generated_korg_output": no_files_with_forbidden_ext(),
    "no_sty_set_generated": no_files_with_forbidden_ext(),
    "no_prs_prf_kst_generated": no_files_with_forbidden_ext(),
    "no_usb_pa3x_deploy_payment_positive_action": no_positive_unsafe_actions(),
}
errors = [name for name, result in checks.items() if not result["pass"]]
result = {"checks": checks, "errors": errors, "status": "PASS" if not errors else "FAIL", "pass": not errors}
RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if not errors else 1)
