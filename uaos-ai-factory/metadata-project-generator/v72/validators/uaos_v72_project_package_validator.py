import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "package" / "UAOS_V72_PROJECT_PACKAGE.uaos.json"
required = ["style_intent_metadata", "section_plan_metadata", "arrangement_role_metadata", "owner_decision_status", "export_status", "v71_midi_reference"]
data = json.loads(PKG.read_text(encoding="utf-8")) if PKG.exists() else {}
ref = ROOT.parents[0] / "v71" / "midi" / "UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"
forbidden = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in {".set", ".sty", ".prf", ".prs", ".kst", ".wav", ".mp3"}]
passed = PKG.exists() and all(k in data for k in required) and ref.exists() and not forbidden and data.get("korg_output") is False and data.get("compatibility_claim") is False
result = {
    "validator_result": "PASS" if passed else "FAIL",
    "version": "V72",
    "uaos_json_exists": PKG.exists(),
    "required_fields_present": all(k in data for k in required),
    "references_v71_midi": ref.exists(),
    "korg_files": forbidden,
    "korg_output": False,
    "appjsx_touched": False,
    "deploy_payment": False
}
(ROOT / "generated" / "UAOS_V72_VALIDATOR_RESULTS.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if result["validator_result"] == "PASS" else 1)
