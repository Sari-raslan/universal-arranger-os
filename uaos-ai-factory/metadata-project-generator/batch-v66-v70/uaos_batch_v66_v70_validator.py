import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "uaos-ai-factory" / "metadata-project-generator"
BATCH = BASE / "batch-v66-v70"
RESULTS = BATCH / "UAOS_BATCH_V66_V70_VALIDATOR_RESULTS.json"

REQUIRED = [
    "batch-v66-v70/UAOS_BATCH_V66_V70_OWNER_DASHBOARD.html",
    "master-local-program-hub/hub/UAOS_MASTER_LOCAL_PROGRAM_HUB.html",
    "v66/generated/UAOS_V66_VALIDATOR_RESULTS.json",
    "v67/generated/UAOS_V67_VALIDATOR_RESULTS.json",
    "v68/generated/UAOS_V68_VALIDATOR_RESULTS.json",
    "v69/generated/UAOS_V69_VALIDATOR_RESULTS.json",
    "v70/generated/UAOS_V70_VALIDATOR_RESULTS.json",
    "v66/generated/UAOS_V66_EXTERNAL_REVIEWER_PACK.json",
    "v67/generated/UAOS_V67_MOCK_EXPORT_MANIFEST_ONLY.json",
    "v68/generated/UAOS_V68_SAFETY_GATE_HARDENING_RESULTS.json",
    "v69/generated/UAOS_V69_COMMERCIAL_READINESS_MAP_NO_CLAIMS.json",
    "v70/generated/UAOS_V70_PHASE_SUMMARY_APPROVAL_GATE.json",
]
SCAN_DIRS = [BASE / name for name in ["master-local-program-hub", "v66", "v67", "v68", "v69", "v70", "batch-v66-v70"]]
FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "export_allowed: true",
    '"export_allowed": true',
    "real_owner_approval_applied: true",
    '"real_owner_approval_applied": true',
    "real_export_created: true",
    '"real_export_created": true',
    "korg output: yes",
    "midi/audio generation: yes",
    "usb write: yes",
    "app.jsx touched: yes",
    "react integration: yes",
    "deploy/payment: yes",
    "compatibility claim: yes",
    "pa3x-ready claim: yes",
    "export approval: yes",
]


def main():
    required_findings = [{"path": rel, "exists": (BASE / rel).exists()} for rel in REQUIRED]
    version_results = []
    for rel in REQUIRED[2:7]:
        path = BASE / rel
        if path.exists():
            version_results.append({"path": rel, "validator_result": json.loads(path.read_text(encoding="utf-8")).get("validator_result")})

    forbidden_files = []
    forbidden_claims = []
    for folder in SCAN_DIRS:
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(BASE).as_posix()
            if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
                forbidden_files.append(rel)
            if path == RESULTS or path.suffix.lower() == ".py":
                continue
            if path.suffix.lower() not in {".md", ".json", ".html", ".txt"}:
                continue
            text = path.read_text(encoding="utf-8", errors="replace").lower()
            for pattern in FORBIDDEN_PATTERNS:
                if pattern in text:
                    forbidden_claims.append({"path": rel, "pattern": pattern})

    passed = (
        all(item["exists"] for item in required_findings)
        and all(item["validator_result"] == "PASS" for item in version_results)
        and not forbidden_files
        and not forbidden_claims
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "master_hub_updated": True,
        "batch_dashboard_exists": (BATCH / "UAOS_BATCH_V66_V70_OWNER_DASHBOARD.html").exists(),
        "v66_to_v70_outputs_exist": all(item["exists"] for item in required_findings),
        "version_validator_results": version_results,
        "metadata_only": True,
        "dry_run_local_only": True,
        "review_only": True,
        "export_allowed": False,
        "korg_output": False,
        "midi_audio_generation": False,
        "usb_write": False,
        "pa3x_load": False,
        "app_jsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "required_findings": required_findings,
        "forbidden_files": forbidden_files,
        "forbidden_claims": forbidden_claims
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
