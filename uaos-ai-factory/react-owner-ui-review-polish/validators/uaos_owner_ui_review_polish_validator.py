from pathlib import Path
import json
import re
from datetime import datetime, timezone

ROOT = Path(r"E:\keyboard-manager-clean")
APP = ROOT / "uaos-live-clean"
RUN = ROOT / "uaos-ai-factory" / "react-owner-ui-review-polish"
APP_JSX = APP / "src" / "App.jsx"
STYLE = APP / "src" / "style.css"
RESULTS = RUN / "validators" / "UAOS_OWNER_UI_REVIEW_POLISH_RESULTS.json"
checks = []

def add(name, passed, detail=""):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})

app_text = APP_JSX.read_text(encoding="utf-8", errors="ignore") if APP_JSX.exists() else ""
style_text = STYLE.read_text(encoding="utf-8", errors="ignore") if STYLE.exists() else ""
combined = app_text + "\n" + style_text

add("build_pass", (APP / "dist" / "index.html").exists(), str(APP / "dist" / "index.html"))
add("app_jsx_backup_exists", (RUN / "logs" / "App.jsx.backup.before-owner-ui-polish.jsx").exists())
add("owner_home_polished", "Owner Review Home" in app_text and "Open/Test" in app_text)
add("required_safety_visible", all(term in app_text for term in ["KORG Writer: BLOCKED", ".STY/.SET: BLOCKED", "USB: BLOCKED", "PA3X Load: BLOCKED", "Deploy: NOT RUN"]))

claim_hits = [term for term in ["PA3X-ready", "KORG-compatible"] if re.search(re.escape(term), combined, flags=re.IGNORECASE)]
add("no_false_claims", not claim_hits, ", ".join(claim_hits))

writer_hits = [term for term in ["function writeKorg", "class KorgWriter", "KORG Writer implementation", "binary KORG writer"] if term in combined]
add("no_korg_writer", not writer_hits, ", ".join(writer_hits))

bad_exts = {".sty", ".set", ".prs", ".prf", ".kst"}
bad_generated = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in bad_exts]
add("no_blocked_korg_files_generated", not bad_generated, "; ".join(bad_generated))

unsafe_hits = []
for p in list(RUN.rglob("*")) + [APP_JSX, STYLE]:
    if not p.is_file() or p.name in {"uaos_owner_ui_review_polish_validator.py", "UAOS_OWNER_UI_REVIEW_POLISH_RESULTS.json"}:
        continue
    if p.suffix.lower() not in {".md", ".json", ".html", ".txt", ".jsx", ".css"}:
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    for term in ["vercel deploy", "git push", "USB write executed", "PA3X load executed", "payment processed"]:
        if term in text:
            unsafe_hits.append(f"{p}:{term}")
add("no_deploy_push_usb_pa3x_payment_actions", not unsafe_hits, "; ".join(unsafe_hits))

passed = all(c["passed"] for c in checks)
result = {
    "validator": "uaos_owner_ui_review_polish_validator",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "result": "PASS" if passed else "FAIL",
    "checks": checks,
    "buildPass": (APP / "dist" / "index.html").exists(),
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
