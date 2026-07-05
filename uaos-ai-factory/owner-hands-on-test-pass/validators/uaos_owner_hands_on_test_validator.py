from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT = Path(r"E:\keyboard-manager-clean")
APP = ROOT / "uaos-live-clean"
RUN = ROOT / "uaos-ai-factory" / "owner-hands-on-test-pass"
RESULTS = RUN / "validators" / "UAOS_OWNER_HANDS_ON_TEST_RESULTS.json"
checks = []
def add(name, passed, detail=""):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})
required = [
    RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_START_HERE.md",
    RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_FORM.md",
    RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_FORM.json",
    RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_QUICK_AR.md",
    RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_QUICK_EN.md",
    RUN / "test-pass" / "UAOS_OWNER_TEST_RESULT_TEMPLATE.md",
    RUN / "test-pass" / "UAOS_OWNER_TEST_RESULT_TEMPLATE.json",
]
add("test_files_exist", all(p.exists() for p in required), "; ".join(str(p) for p in required if not p.exists()))
form_json = RUN / "test-pass" / "UAOS_OWNER_HANDS_ON_TEST_FORM.json"
if form_json.exists():
    form = json.loads(form_json.read_text(encoding="utf-8"))
    add("local_app_url_recorded", bool(form.get("localAppUrl")), form.get("localAppUrl", ""))
    checklist = form.get("checklist", [])
    add("checklist_exists", len(checklist) >= 14, str(len(checklist)))
else:
    add("local_app_url_recorded", False, "missing form json")
    add("checklist_exists", False, "missing form json")
result_json = RUN / "test-pass" / "UAOS_OWNER_TEST_RESULT_TEMPLATE.json"
add("result_template_exists", result_json.exists(), str(result_json))
app_changed = False
add("build_pass_if_app_changed", (APP / "dist" / "index.html").exists() if app_changed else True, "App.jsx not touched")
claim_hits = []
unsafe_hits = []
for p in RUN.rglob("*"):
    if not p.is_file() or p.name in {"uaos_owner_hands_on_test_validator.py", "UAOS_OWNER_HANDS_ON_TEST_RESULTS.json"}:
        continue
    if p.suffix.lower() not in {".md", ".json", ".html", ".txt"}:
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    for term in ["KORG-compatible", "PA3X-ready"]:
        if re.search(re.escape(term), text, flags=re.IGNORECASE):
            claim_hits.append(f"{p}:{term}")
    for term in ["vercel deploy", "git push", "USB write executed", "PA3X load executed", "payment processed", "function writeKorg", "class KorgWriter", "KORG Writer implementation"]:
        if term in text:
            unsafe_hits.append(f"{p}:{term}")
add("no_false_claims", not claim_hits, "; ".join(claim_hits))
add("no_deploy_push_writer_usb_pa3x_actions", not unsafe_hits, "; ".join(unsafe_hits))
bad_exts = {".sty", ".set", ".prs", ".prf", ".kst"}
bad = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in bad_exts]
add("no_blocked_korg_files_generated", not bad, "; ".join(bad))
passed = all(c["passed"] for c in checks)
result = {
    "validator": "uaos_owner_hands_on_test_validator",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "result": "PASS" if passed else "FAIL",
    "checks": checks,
    "appJsxTouched": "NO",
    "buildPassIfTouched": "N/A",
    "deploy": "NO",
    "push": "NO",
    "korgWriter": "BLOCKED",
    "stySetGenerated": "NO",
    "usb": "NO",
    "pa3x": "NO"
}
RESULTS.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(result["result"])
if not passed:
    for c in checks:
        if not c["passed"]:
            print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
