from pathlib import Path
import json
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "UAOS_RELAXED_PRODUCT_MODE_VALIDATOR_RESULTS.json"
checks = []
def add(name, ok, detail=""):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})
policy_md = BASE / "UAOS_RELAXED_PRODUCT_MODE_POLICY.md"
policy_json = BASE / "UAOS_RELAXED_PRODUCT_MODE_POLICY.json"
add("policy markdown exists", policy_md.exists(), str(policy_md))
add("policy json exists", policy_json.exists(), str(policy_json))
try:
    data = json.loads(policy_json.read_text(encoding="utf-8"))
except Exception as exc:
    data = {}
    add("policy json parses", False, str(exc))
else:
    add("policy json parses", True)
allowed = data.get("allowed_when_requested", {})
blocked = data.get("blocked", {})
workflow = data.get("workflow", {})
add("App/React allowed when requested", allowed.get("app_jsx_changes") is True and allowed.get("react_integration") is True)
add("deploy allowed only when explicitly requested", allowed.get("deploy_only_if_explicitly_requested") is True)
add("KORG writer blocked", blocked.get("korg_writer_implementation") is True and blocked.get("binary_korg_writer") is True)
add(".STY/.SET generation blocked", blocked.get("real_sty_generation") is True and blocked.get("real_set_generation") is True)
add("USB blocked", blocked.get("usb_write") is True and blocked.get("package_copy_to_usb") is True)
add("PA3X load blocked", blocked.get("pa3x_load") is True)
add("false compatibility claims blocked", blocked.get("pa3x_ready_claim") is True and blocked.get("korg_compatible_claim") is True and blocked.get("real_korg_export_works_claim") is True)
add("agents-prewrite / Code-X-integrator workflow recorded", workflow.get("agents_prewrite_files") is True and workflow.get("code_x_final_integrator") is True)
result = {"status": "PASS" if all(c["ok"] for c in checks) else "FAIL", "checks": checks}
OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
if result["status"] != "PASS":
    raise SystemExit(1)
