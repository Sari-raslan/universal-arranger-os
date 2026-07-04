import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "uaos-ai-factory" / "metadata-project-generator"
BATCH = BASE / "batch-v61-v65"
RESULTS = BATCH / "UAOS_BATCH_V61_V65_VALIDATOR_RESULTS.json"

REQUIRED = [
    "master-local-program-hub/hub/UAOS_MASTER_LOCAL_PROGRAM_HUB.html",
    "batch-v61-v65/UAOS_BATCH_V61_V65_OWNER_DASHBOARD.html",
    "v61/validators/UAOS_V61_BATCH_VALIDATOR_RESULTS.json",
    "v62/validators/UAOS_V62_VALIDATOR_RESULTS.json",
    "v63/validators/UAOS_V63_VALIDATOR_RESULTS.json",
    "v64/validators/UAOS_V64_VALIDATOR_RESULTS.json",
    "v65/validators/UAOS_V65_VALIDATOR_RESULTS.json",
    "v62/metadata/UAOS_V62_STYLE_INTENT_EXPANSION.json",
    "v63/metadata/UAOS_V63_ARRANGEMENT_QA_MATRIX.json",
    "v64/metadata/UAOS_V64_EXPORT_UNKNOWNS_REGISTER.json",
    "v65/metadata/UAOS_V65_HUMAN_REVIEW_CHECKLIST.md",
]
SCAN_DIRS = [BASE / name for name in ["master-local-program-hub", "v61", "v62", "v63", "v64", "v65", "batch-v61-v65"]]
FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "export_allowed: true",
    '"export_allowed": true',
    "real_owner_approval_applied: true",
    '"real_owner_approval_applied": true',
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
    forbidden_files = []
    forbidden_claims = []
    validator_results = []

    for rel in REQUIRED[2:7]:
        path = BASE / rel
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            validator_results.append({"path": rel, "validator_result": data.get("validator_result")})

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
            if path.suffix.lower() not in {".md", ".json", ".html", ".txt", ".py"}:
                continue
            text = path.read_text(encoding="utf-8", errors="replace").lower()
            for pattern in FORBIDDEN_PATTERNS:
                if pattern in text:
                    forbidden_claims.append({"path": rel, "pattern": pattern})

    passed = (
        all(item["exists"] for item in required_findings)
        and all(item["validator_result"] == "PASS" for item in validator_results)
        and not forbidden_files
        and not forbidden_claims
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "master_hub_exists": (BASE / "master-local-program-hub/hub/UAOS_MASTER_LOCAL_PROGRAM_HUB.html").exists(),
        "batch_dashboard_exists": (BATCH / "UAOS_BATCH_V61_V65_OWNER_DASHBOARD.html").exists(),
        "v61_to_v65_outputs_exist": all(item["exists"] for item in required_findings),
        "version_validator_results": validator_results,
        "metadata_only": True,
        "dry_run_local_only": True,
        "export_allowed": False,
        "korg_output": False,
        "midi_audio": False,
        "usb_path": False,
        "app_jsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "required_findings": required_findings,
        "forbidden_files": forbidden_files,
        "forbidden_claims": forbidden_claims,
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
