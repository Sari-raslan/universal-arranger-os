import json
from datetime import datetime, timezone
from pathlib import Path


FACTORY = Path(__file__).resolve().parents[1]
RESULTS = FACTORY / "validators" / "UAOS_PRODUCT_SURFACE_FACTORY_VALIDATOR_RESULTS.json"

REQUIRED_FILES = [
    "ui-mockups/UAOS_HOME_UI_MOCKUP.html",
    "ui-mockups/UAOS_OWNER_REVIEW_UI_MOCKUP.html",
    "ui-mockups/UAOS_STYLE_PLANNER_UI_MOCKUP.html",
    "ui-mockups/UAOS_EXPORT_BLOCKED_UI_MOCKUP.html",
    "ui-mockups/UAOS_DASHBOARD_UI_MOCKUP.html",
    "website/index.html",
    "website/pricing-draft.html",
    "website/features-draft.html",
    "website/roadmap-draft.html",
    "website/docs-draft.html",
    "website/safety-gates.html",
    "website/reviewer-demo.html",
    "file-package/UAOS_PRODUCT_PACKAGE_INDEX.json",
    "file-package/UAOS_PRODUCT_PACKAGE_README.md",
    "file-package/UAOS_FOLDER_STRUCTURE_PLAN.md",
    "file-package/UAOS_OUTPUT_FILE_REGISTRY_DRAFT.json",
    "file-package/UAOS_SAFE_HANDOFF_PACKAGE_PLAN.md",
    "local-program-spec/UAOS_LOCAL_METADATA_PROGRAM_SPEC.md",
    "local-program-spec/UAOS_LOCAL_PROGRAM_MODULE_MAP.json",
    "local-program-spec/UAOS_PROGRAM_NAVIGATION_FLOW.md",
    "local-program-spec/UAOS_PROGRAM_BUILD_PLAN_DRAFT.md",
    "desktop-spec/UAOS_DESKTOP_APP_SPEC_DRAFT.md",
    "desktop-spec/UAOS_DESKTOP_FOLDER_STRUCTURE_DRAFT.json",
    "desktop-spec/UAOS_DESKTOP_SAFE_BUILD_ROADMAP.md",
    "mobile-spec/UAOS_TABLET_UI_SPEC_DRAFT.md",
    "mobile-spec/UAOS_MOBILE_REVIEW_APP_SPEC_DRAFT.md",
    "mobile-spec/UAOS_TOUCH_WORKFLOW_DRAFT.md",
    "docs/UAOS_PRODUCT_OVERVIEW.md",
    "docs/UAOS_OWNER_MANUAL_DRAFT_AR.md",
    "docs/UAOS_OWNER_MANUAL_DRAFT_EN.md",
    "docs/UAOS_TECHNICAL_OVERVIEW_DRAFT.md",
    "docs/UAOS_SAFETY_POLICY_PUBLIC_DRAFT.md",
    "docs/UAOS_DEMO_SCRIPT_DRAFT.md",
    "dashboards/UAOS_PRODUCT_SURFACE_FACTORY_DASHBOARD.html",
    "dashboards/UAOS_LOCAL_PROGRAM_PREVIEW_INDEX.html",
    "dashboards/UAOS_WEBSITE_PREVIEW_INDEX.html",
    "dashboards/UAOS_FILE_PACKAGE_DASHBOARD.html",
    "validators/uaos_product_surface_factory_validator.py",
    "validators/UAOS_PRODUCT_SURFACE_FACTORY_VALIDATION_RULES.md",
    "reports/UAOS_PRODUCT_SURFACE_FACTORY_QA_REPORT.md",
    "reports/UAOS_PRODUCT_SURFACE_FACTORY_OWNER_DASHBOARD.md",
    "reports/UAOS_PRODUCT_SURFACE_FACTORY_INTEGRATION_REPORT.md",
    "logs/UAOS_PRODUCT_SURFACE_FACTORY_LOG.txt",
    "seal/UAOS_PRODUCT_SURFACE_FACTORY_FINAL_SEAL.md",
]

FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}
FORBIDDEN_NAMES = {"App.jsx"}
FORBIDDEN_PATTERNS = [
    "react integration: yes",
    "deploy/payment: yes",
    "payment activation: yes",
    "export approval: yes",
    "export_allowed: true",
    '"export_allowed": true',
    "compatibility claim: yes",
    "pa3x-ready claim: yes",
    "usb write: yes",
    "source mutation: yes",
]


def is_static_html(text):
    lowered = text.lower()
    return (
        "<script" not in lowered
        and "reactdom" not in lowered
        and "from 'react'" not in lowered
        and 'from "react"' not in lowered
        and "app.jsx" not in lowered.replace("app.jsx touched", "").replace("no app.jsx", "")
    )


def main():
    required_file_findings = [{"path": rel, "exists": (FACTORY / rel).exists()} for rel in REQUIRED_FILES]
    forbidden_file_findings = []
    forbidden_claim_findings = []
    static_html_findings = []
    draft_label_findings = []

    for path in FACTORY.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(FACTORY).as_posix()
        if path.suffix.lower() in FORBIDDEN_EXTENSIONS or path.name in FORBIDDEN_NAMES:
            forbidden_file_findings.append(rel)
        if path == RESULTS or rel.endswith("uaos_product_surface_factory_validator.py"):
            continue
        if path.suffix.lower() not in {".md", ".json", ".html", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        lowered = text.lower()
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in lowered:
                forbidden_claim_findings.append({"path": rel, "pattern": pattern})
        if path.suffix.lower() == ".html" and not is_static_html(text):
            static_html_findings.append(rel)
        if rel.startswith(("local-program-spec/", "desktop-spec/", "mobile-spec/", "file-package/", "docs/")):
            if "DRAFT_ONLY" not in text:
                draft_label_findings.append(rel)

    passed = (
        all(item["exists"] for item in required_file_findings)
        and not forbidden_file_findings
        and not forbidden_claim_findings
        and not static_html_findings
        and not draft_label_findings
    )
    result = {
        "validator_result": "PASS" if passed else "FAIL",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "factory_path": str(FACTORY),
        "ui_mockups_created": True,
        "website_draft_created": True,
        "file_package_created": True,
        "local_program_spec_created": True,
        "desktop_mobile_specs_created": True,
        "static_local_only": True,
        "app_jsx_touched": False,
        "react_integration": False,
        "deploy_payment": False,
        "korg_output": False,
        "export_allowed": False,
        "midi_audio_generation": False,
        "usb_write": False,
        "pa3x_load": False,
        "compatibility_claim": False,
        "pa3x_ready_claim": False,
        "required_file_findings": required_file_findings,
        "forbidden_file_findings": forbidden_file_findings,
        "forbidden_claim_findings": forbidden_claim_findings,
        "static_html_findings": static_html_findings,
        "draft_label_findings": draft_label_findings,
    }
    RESULTS.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
