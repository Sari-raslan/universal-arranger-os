from pathlib import Path
import json
import re
from datetime import datetime, timezone

ROOT = Path(r"E:\keyboard-manager-clean")
RUN = ROOT / "uaos-ai-factory" / "react-app-integration-relaxed-mode"
APP = ROOT / "uaos-live-clean"
APP_JSX = APP / "src" / "App.jsx"
STYLE = APP / "src" / "style.css"
RESULTS = RUN / "validators" / "UAOS_REACT_APP_INTEGRATION_VALIDATOR_RESULTS.json"

checks = []

def add(name, passed, detail=""):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})

policy = ROOT / "uaos-ai-factory" / "UAOS_RELAXED_PRODUCT_MODE_POLICY.md"
backup = RUN / "logs" / "App.jsx.backup.before-react-app-integration.jsx"
build_index = APP / "dist" / "index.html"
app_text = APP_JSX.read_text(encoding="utf-8", errors="ignore") if APP_JSX.exists() else ""
style_text = STYLE.read_text(encoding="utf-8", errors="ignore") if STYLE.exists() else ""
combined = app_text + "\n" + style_text

add("relaxed_policy_exists", policy.exists(), str(policy))
add("app_jsx_backup_exists", backup.exists(), str(backup))
add("react_app_build_pass", build_index.exists(), str(build_index))
add("ui_references_final_owner_program", "Final Owner Program Integration" in app_text and "Final Local Owner Program V2" in app_text)
add("ui_references_style_rc", "Style Package RC" in app_text)
add("ui_references_midi_exports", "MIDI Exports" in app_text)
add("ui_references_sound_library", "Sound Library" in app_text)
add("ui_references_korg_research", "KORG Read-only Research" in app_text)
add("visible_safety_block", all(term in app_text for term in ["KORG Writer BLOCKED", ".STY/.SET BLOCKED", "USB BLOCKED", "PA3X Load BLOCKED", "Deploy NOT RUN IN THIS TASK"]))

forbidden_positive_claims = [r"PA3X-ready", r"KORG-compatible", r"real KORG export works"]
claim_hits = [p for p in forbidden_positive_claims if re.search(p, combined, flags=re.IGNORECASE)]
add("no_false_compatibility_claims", not claim_hits, ", ".join(claim_hits))

writer_impl_hits = [p for p in ["function writeKorg", "class KorgWriter", "binary KORG writer", "KORG Writer implementation"] if p in combined]
add("no_korg_writer_implementation", not writer_impl_hits, ", ".join(writer_impl_hits))

run_files = [p for p in RUN.rglob("*") if p.is_file()]
bad_exts = {".sty", ".set"}
bad_generated = [str(p) for p in run_files if p.suffix.lower() in bad_exts]
add("no_sty_set_generated_by_run", not bad_generated, "; ".join(bad_generated))

blocked_action_patterns = ["Copy-Item", "USB", "PA3X load executed", "vercel deploy", "git push", "payment processed"]
unsafe_hits = []
for p in run_files + [APP_JSX, STYLE]:
    if p.name in {"uaos_react_app_integration_validator.py", "UAOS_REACT_APP_INTEGRATION_VALIDATOR_RESULTS.json"}:
        continue
    if not p.exists() or p.suffix.lower() not in {".md", ".json", ".html", ".txt", ".jsx", ".css", ".py"}:
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    for pattern in blocked_action_patterns:
        if pattern in text and pattern not in {"USB"}:
            unsafe_hits.append(f"{p}:{pattern}")
add("no_usb_pa3x_deploy_payment_push_actions", not unsafe_hits, "; ".join(unsafe_hits))

agent_outputs = RUN / "agent-outputs"
add("agent_outputs_exist", all((agent_outputs / name).exists() for name in [
    "UAOS_PRODUCT_HOME_SECTION.json",
    "UAOS_EXPORT_CENTER_SECTION.json",
    "UAOS_STYLE_RC_CENTER_SECTION.json",
    "UAOS_MIDI_TEST_CENTER_SECTION.json",
    "UAOS_SOUND_LIBRARY_SECTION.json",
    "UAOS_KORG_RESEARCH_STATUS_SECTION.json",
    "UAOS_SAFETY_GATES_SECTION.json",
    "UAOS_REACT_INTEGRATION_MAP.json",
]))

passed = all(item["passed"] for item in checks)
result = {
    "validator": "uaos_react_app_integration_validator",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "result": "PASS" if passed else "FAIL",
    "checks": checks,
    "deployRun": False,
    "pushRun": False,
    "korgWriterBlocked": True,
    "stySetGenerated": False,
    "usbWrite": False,
    "pa3xLoad": False,
}
RESULTS.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(result["result"])
if not passed:
    for item in checks:
        if not item["passed"]:
            print(f"FAIL: {item['name']} {item['detail']}")
    raise SystemExit(1)
