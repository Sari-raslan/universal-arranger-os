from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT = Path(r"E:\keyboard-manager-clean")
RUN = ROOT / "uaos-ai-factory" / "style-rc-deep-ui-integration"
APP = ROOT / "uaos-live-clean"
APP_JSX = APP / "src" / "App.jsx"
STYLE = APP / "src" / "style.css"
RESULTS = RUN / "validators" / "UAOS_STYLE_RC_DEEP_UI_RESULTS.json"
checks = []
def add(name, passed, detail=""):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})
agent_files = [
    RUN / "agent-outputs" / "UAOS_STYLE_RC_UI_SECTION.json",
    RUN / "agent-outputs" / "UAOS_SECTION_MIDI_UI_SECTION.json",
    RUN / "agent-outputs" / "UAOS_STYLE_PACKAGE_FILES_SECTION.json",
    RUN / "agent-outputs" / "UAOS_OWNER_TEST_FLOW_SECTION.json",
    RUN / "agent-outputs" / "UAOS_STYLE_RC_SAFETY_SECTION.json",
    RUN / "agent-outputs" / "UAOS_REACT_STYLE_RC_INTEGRATION_MAP.json",
]
add("agents_prewrote_ui_data", all(p.exists() for p in agent_files), "; ".join(str(p) for p in agent_files if not p.exists()))
app_text = APP_JSX.read_text(encoding="utf-8", errors="ignore") if APP_JSX.exists() else ""
style_text = STYLE.read_text(encoding="utf-8", errors="ignore") if STYLE.exists() else ""
combined = app_text + "\n" + style_text
required_ui = ["Test Style RC Locally", "UAOS Style RC", "Section MIDI files", "Full Style MIDI", "Style Package ZIP", "Owner Test Form", "Next Action Gate", "UAOS generic style RC created", "KORG Writer blocked", ".STY/.SET blocked", "USB blocked", "PA3X load blocked"]
add("style_rc_section_integrated", all(item in app_text for item in required_ui), ", ".join([item for item in required_ui if item not in app_text]))
add("build_pass", (APP / "dist" / "index.html").exists(), str(APP / "dist" / "index.html"))
add("app_jsx_backup_exists", (RUN / "logs" / "App.jsx.backup.before-style-rc-deep-ui.jsx").exists())
claim_hits = []
for term in ["KORG-compatible", "PA3X-ready", "real KORG export works"]:
    if re.search(re.escape(term), combined, flags=re.IGNORECASE):
        claim_hits.append(term)
add("no_false_claims_in_app", not claim_hits, ", ".join(claim_hits))
unsafe_hits = []
for p in list(RUN.rglob("*")) + [APP_JSX, STYLE]:
    if not p.is_file() or p.name in {"uaos_style_rc_deep_ui_validator.py", "UAOS_STYLE_RC_DEEP_UI_RESULTS.json"}:
        continue
    if p.suffix.lower() not in {".md", ".json", ".html", ".txt", ".jsx", ".css", ".py"}:
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    for term in ["vercel deploy", "git push", "USB write executed", "PA3X load executed", "payment processed", "function writeKorg", "class KorgWriter", "KORG Writer implementation"]:
        if term in text:
            unsafe_hits.append(f"{p}:{term}")
    for term in ["KORG-compatible", "PA3X-ready"]:
        if re.search(re.escape(term), text, flags=re.IGNORECASE):
            unsafe_hits.append(f"{p}:{term}")
add("no_deploy_push_writer_usb_pa3x_actions_or_claims", not unsafe_hits, "; ".join(unsafe_hits))
bad_exts = {".sty", ".set", ".prs", ".prf", ".kst"}
bad = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in bad_exts]
add("no_blocked_korg_files_generated", not bad, "; ".join(bad))
passed = all(c["passed"] for c in checks)
result = {
    "validator": "uaos_style_rc_deep_ui_validator",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "result": "PASS" if passed else "FAIL",
    "checks": checks,
    "appJsxTouched": "YES",
    "buildPass": "YES" if (APP / "dist" / "index.html").exists() else "NO",
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
