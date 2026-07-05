from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT = Path(r"E:\keyboard-manager-clean")
RUN = ROOT / "uaos-ai-factory" / "owner-test-result-capture"
RESULTS = RUN / "validators" / "UAOS_OWNER_TEST_RESULT_CAPTURE_RESULTS.json"
checks = []
def add(name, passed, detail=""):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})
result_files = [
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_CAPTURE_START_HERE.md",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_FORM.md",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_FORM.json",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_QUICK_AR.md",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_QUICK_EN.md",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_FILLED_EXAMPLE.md",
    RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_FILLED_EXAMPLE.json",
]
gate_files = [
    RUN / "next-gate" / "UAOS_NEXT_ACTION_GATE_AFTER_OWNER_TEST.md",
    RUN / "next-gate" / "UAOS_NEXT_ACTION_GATE_AFTER_OWNER_TEST.json",
    RUN / "next-gate" / "UAOS_NEXT_ACTION_OPTIONS_AR.md",
    RUN / "next-gate" / "UAOS_NEXT_ACTION_OPTIONS_EN.md",
]
add("result_capture_files_exist", all(p.exists() for p in result_files), "; ".join(str(p) for p in result_files if not p.exists()))
add("next_action_gate_exists", all(p.exists() for p in gate_files), "; ".join(str(p) for p in gate_files if not p.exists()))
form_json = RUN / "result-capture" / "UAOS_OWNER_TEST_RESULT_FORM.json"
if form_json.exists():
    form = json.loads(form_json.read_text(encoding="utf-8"))
    required = ["home_loaded", "cards_visible", "style_rc_visible", "midi_exports_visible", "sound_library_visible", "korg_research_visible", "safety_gates_visible", "owner_can_test_now", "confusing_parts", "missing_parts", "approved_next_action"]
    fields = form.get("resultFields", {})
    add("required_result_fields_exist", all(key in fields for key in required), ", ".join([key for key in required if key not in fields]))
    add("auto_apply_disabled", form.get("autoApplyNextAction") is False)
else:
    add("required_result_fields_exist", False, "missing form json")
    add("auto_apply_disabled", False, "missing form json")
gate_json = RUN / "next-gate" / "UAOS_NEXT_ACTION_GATE_AFTER_OWNER_TEST.json"
if gate_json.exists():
    gate = json.loads(gate_json.read_text(encoding="utf-8"))
    add("gate_has_eight_options", len(gate.get("options", [])) == 8, str(len(gate.get("options", []))))
    add("gate_auto_apply_disabled", gate.get("autoApplyNextAction") is False)
else:
    add("gate_has_eight_options", False, "missing gate json")
    add("gate_auto_apply_disabled", False, "missing gate json")
claim_hits = []
unsafe_hits = []
for p in RUN.rglob("*"):
    if not p.is_file() or p.name in {"uaos_owner_test_result_capture_validator.py", "UAOS_OWNER_TEST_RESULT_CAPTURE_RESULTS.json"}:
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
    "validator": "uaos_owner_test_result_capture_validator",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "result": "PASS" if passed else "FAIL",
    "checks": checks,
    "autoApplyNextAction": "NO",
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
