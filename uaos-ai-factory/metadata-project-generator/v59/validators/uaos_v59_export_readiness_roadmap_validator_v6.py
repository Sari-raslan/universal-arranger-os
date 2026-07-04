import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[2]
GENERATED = ROOT / "generated"
REPORTS = ROOT / "reports"
DASHBOARDS = ROOT / "dashboards"
OWNER_INPUT = ROOT / "owner-input"
ROADMAP = ROOT / "roadmap"
LOGS = ROOT / "logs"
RESULT_PATH = GENERATED / "UAOS_V59_EXPORT_READINESS_ROADMAP_VALIDATOR_V6_RESULTS.json"
QA_PATH = REPORTS / "UAOS_V59_QA_REPORT.md"
DASHBOARD_MD_PATH = REPORTS / "UAOS_V59_OWNER_DASHBOARD.md"
DASHBOARD_HTML_PATH = DASHBOARDS / "UAOS_V59_OWNER_DASHBOARD.html"
SEAL_PATH = REPORTS / "UAOS_V59_FINAL_SEAL.md"

REQUIRED_JSON = {
    "normalized": GENERATED / "UAOS_V59_OWNER_DECISION_NORMALIZED_PENDING.json",
    "trace": GENERATED / "UAOS_V59_OWNER_DECISION_NORMALIZER_TRACE.json",
    "consolidation": GENERATED / "UAOS_V59_STYLE_PLAN_CONSOLIDATION_DRYRUN_V5.json",
    "intent": GENERATED / "UAOS_V59_CONSOLIDATED_STYLE_INTENT_PENDING_OWNER_REVIEW.json",
    "sections": GENERATED / "UAOS_V59_CONSOLIDATED_SECTION_PLAN_PENDING_OWNER_REVIEW.json",
    "owner_form": OWNER_INPUT / "UAOS_V59_OWNER_PENDING_INPUT_REVIEW_FORM.json",
    "roadmap": ROADMAP / "UAOS_V59_EXPORT_READINESS_ROADMAP_BLOCKED.json",
}

REQUIRED_FILES = [
    OWNER_INPUT / "UAOS_V59_OWNER_PENDING_INPUT_REVIEW_FORM.md",
    OWNER_INPUT / "UAOS_V59_OWNER_REVIEW_GUIDE_AR.md",
    OWNER_INPUT / "UAOS_V59_OWNER_REVIEW_GUIDE_EN.md",
    ROADMAP / "UAOS_V59_EXPORT_READINESS_ROADMAP_BLOCKED.md",
    Path(__file__).resolve(),
    ROOT / "validators" / "UAOS_V59_VALIDATION_RULES.md",
    QA_PATH,
    DASHBOARD_MD_PATH,
    DASHBOARD_HTML_PATH,
    SEAL_PATH,
    LOGS / "UAOS_V59_BIG_RUN_LOG.txt",
]

FORBIDDEN_EXTENSIONS = {
    ".set",
    ".sty",
    ".prf",
    ".prs",
    ".kst",
    ".mid",
    ".midi",
    ".wav",
    ".mp3",
    ".aif",
    ".aiff",
    ".flac",
    ".ogg",
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_json(path: Path, errors: list[str]):
    if not path.exists():
        errors.append(f"Missing JSON: {rel(path)}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid JSON {rel(path)}: {exc}")
        return None


def git_status_for(path: Path) -> str:
    relative = path.relative_to(REPO_ROOT).as_posix()
    result = subprocess.run(
        ["git", "status", "--short", "--", relative],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.stdout.strip()


def assert_false(data, dotted: str, errors: list[str]):
    current = data
    for part in dotted.split("."):
        if not isinstance(current, dict) or part not in current:
            errors.append(f"Missing field {dotted}")
            return
        current = current[part]
    if current is not False:
        errors.append(f"{dotted} must be false")


def assert_true(data, dotted: str, errors: list[str]):
    current = data
    for part in dotted.split("."):
        if not isinstance(current, dict) or part not in current:
            errors.append(f"Missing field {dotted}")
            return
        current = current[part]
    if current is not True:
        errors.append(f"{dotted} must be true")


def scan_files(errors: list[str]):
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path == RESULT_PATH:
            continue
        lower = str(path).lower()
        suffix = path.suffix.lower()
        if suffix in FORBIDDEN_EXTENSIONS:
            errors.append(f"Forbidden output extension in V59: {rel(path)}")
        if "app.jsx" == path.name.lower():
            errors.append(f"Forbidden App.jsx in V59: {rel(path)}")
        if "\\deploy\\" in lower or "/deploy/" in lower:
            errors.append(f"Forbidden deploy path in V59: {rel(path)}")
        if "\\payment\\" in lower or "/payment/" in lower:
            errors.append(f"Forbidden payment path in V59: {rel(path)}")
        text_suffixes = {".json", ".md", ".html", ".txt"}
        if suffix in text_suffixes:
            text = path.read_text(encoding="utf-8", errors="ignore").lower()
            forbidden_positive_claims = [
                "pa3x-ready: yes",
                "compatibility claim: yes",
                "export approval: yes",
                "real owner approval applied: yes",
                "auto apply: yes",
                "auto-apply: yes",
                "source mutation: yes",
                "export_allowed\": true",
                "export allowed: yes",
                "korg_output_allowed\": true",
                "usb_write_allowed\": true",
                "pa3x_load_allowed\": true",
                "real_owner_approval_applied\": true",
                "auto_apply_allowed\": true",
                "source_mutation_allowed\": true",
                "compatibility_claim\": true",
                "pa3x_ready_claim\": true",
            ]
            for claim in forbidden_positive_claims:
                if claim in text:
                    errors.append(f"Forbidden positive claim '{claim}' in {rel(path)}")
            if "react integration: yes" in text or "deploy/payment: yes" in text:
                errors.append(f"Forbidden integration/deploy claim in {rel(path)}")


def main():
    errors: list[str] = []
    warnings: list[str] = []
    parsed = {name: read_json(path, errors) for name, path in REQUIRED_JSON.items()}
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"Missing file: {rel(path)}")

    normalized = parsed.get("normalized")
    consolidation = parsed.get("consolidation")
    roadmap = parsed.get("roadmap")

    if normalized:
        if normalized.get("owner_decision_status") != "PENDING_MANUAL_OWNER_INPUT":
            errors.append("normalized.owner_decision_status must remain PENDING_MANUAL_OWNER_INPUT")
        for field in [
            "real_owner_approval_applied",
            "auto_apply_allowed",
            "export_allowed",
            "korg_output_allowed",
            "source_mutation_allowed",
        ]:
            assert_false(normalized, field, errors)
        for item in normalized.get("normalized_decision_items", []):
            if item.get("owner_decision_status") != "PENDING_MANUAL_OWNER_INPUT":
                errors.append(f"{item.get('decision_id')}.owner_decision_status must remain pending")
            for field in [
                "real_owner_approval_applied",
                "auto_apply_allowed",
                "export_allowed",
                "korg_output_allowed",
                "source_mutation_allowed",
            ]:
                if item.get(field) is not False:
                    errors.append(f"{item.get('decision_id')}.{field} must be false")

    if consolidation:
        if consolidation.get("label") != "STYLE_PLAN_CONSOLIDATION_METADATA_DRY_RUN_ONLY":
            errors.append("consolidation label is incorrect")
        for field in [
            "real_owner_approval_applied",
            "auto_apply_allowed",
            "export_allowed",
            "korg_output_allowed",
            "source_mutation_allowed",
            "compatibility_claim",
            "pa3x_ready_claim",
        ]:
            assert_false(consolidation, field, errors)
        assert_true(consolidation, "metadata_only", errors)
        assert_true(consolidation, "dry_run_only", errors)
        no_output = consolidation.get("no_output_confirmation", {})
        for key in ["audio", "midi", "korg", "native_keyboard_files", "usb", "export"]:
            if no_output.get(key) is not False:
                errors.append(f"no_output_confirmation.{key} must be false")

    if roadmap:
        required_classifications = {
            "BLOCKED",
            "OWNER_INPUT_REQUIRED",
            "TECHNICAL_RESEARCH_REQUIRED",
            "EXPORT_NOT_ALLOWED",
        }
        if set(roadmap.get("readiness_classification", [])) != required_classifications:
            errors.append("roadmap readiness classification must match blocked roadmap set")
        for field in [
            "export_allowed",
            "korg_output_allowed",
            "usb_write_allowed",
            "pa3x_load_allowed",
            "real_owner_approval_applied",
            "auto_apply_allowed",
        ]:
            assert_false(roadmap, field, errors)

    for label, target in [
        ("V37 source project", ROOT.parent / "v37" / "generated" / "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
        ("V42 dry-run project", ROOT.parent / "v42" / "generated" / "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
        ("V44 dry-run project", ROOT.parent / "v44" / "generated" / "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"),
        ("V46 dry-run project", ROOT.parent / "v46" / "generated" / "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json"),
        ("App.jsx", REPO_ROOT / "uaos-ai-factory" / "pc-workstation" / "stable" / "UAOS_PC_WORKSTATION_APP_V10" / "App.jsx"),
    ]:
        if git_status_for(target):
            errors.append(f"{label} appears modified in git status")

    scan_files(errors)

    status = "PASS" if not errors else "FAIL"
    result = {
        "schema_version": "uaos.v59.export.readiness.roadmap.validator.v6.results.v1",
        "status": status,
        "checked_files": {name: rel(path) for name, path in REQUIRED_JSON.items()},
        "readiness_classification": [
            "BLOCKED",
            "OWNER_INPUT_REQUIRED",
            "TECHNICAL_RESEARCH_REQUIRED",
            "EXPORT_NOT_ALLOWED",
        ],
        "errors": errors,
        "warnings": warnings,
        "safety": {
            "metadata_only": True,
            "dry_run_only": True,
            "manual_owner_input_required": True,
            "real_owner_approval_applied": False,
            "auto_apply": False,
            "export_allowed": False,
            "korg_output": False,
            "midi_audio_generation": False,
            "usb_write": False,
            "pa3x_load": False,
            "source_mutation": False,
            "app_js_touched": False,
            "react_integration": False,
            "deploy_payment": False,
            "compatibility_claim": False,
            "pa3x_ready_claim": False,
        },
    }
    RESULT_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    if status == "PASS":
        QA_PATH.write_text(
            "\n".join(
                [
                    "# UAOS V59 QA Report",
                    "",
                    "Inputs read: V58 owner decision pack, printable form, dry-run v4, pending previews, export gate v5, QA, dashboard, final seal",
                    "Outputs created: YES",
                    "V58 inheritance status: read-only reference",
                    "V59 owner decision status: PENDING_MANUAL_OWNER_INPUT",
                    "Manual input required: YES",
                    "Style plan consolidation status: STYLE_PLAN_CONSOLIDATION_METADATA_DRY_RUN_ONLY",
                    "Export readiness roadmap status: BLOCKED / OWNER_INPUT_REQUIRED / TECHNICAL_RESEARCH_REQUIRED / EXPORT_NOT_ALLOWED",
                    "Validator v6 result: PASS",
                    "Forbidden output scan: PASS",
                    "Safety gate scan: PASS",
                    "Source mutation status: NO",
                    "App.jsx status: untouched",
                    "Commit status: ready",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        DASHBOARD_MD_PATH.write_text(
            "\n".join(
                [
                    "# UAOS V59 Owner Dashboard",
                    "",
                    "V59 status: PASS",
                    "Owner input still required: YES",
                    "Real owner approval not applied: YES",
                    "Export blocked: YES",
                    "KORG output blocked: YES",
                    "Style plan is consolidated metadata only: YES",
                    "Export roadmap is blocked / review-only: YES",
                    "Safe next step: V60 manual owner input capture or stop.",
                    "",
                    "Main file paths:",
                    f"- {GENERATED / 'UAOS_V59_OWNER_DECISION_NORMALIZED_PENDING.json'}",
                    f"- {GENERATED / 'UAOS_V59_STYLE_PLAN_CONSOLIDATION_DRYRUN_V5.json'}",
                    f"- {ROADMAP / 'UAOS_V59_EXPORT_READINESS_ROADMAP_BLOCKED.md'}",
                    "Validator: PASS",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        DASHBOARD_HTML_PATH.write_text(
            DASHBOARD_HTML_PATH.read_text(encoding="utf-8").replace(
                "Pending validator run.", "PASS."
            ).replace("Validator: pending", "Validator: PASS"),
            encoding="utf-8",
        )
        SEAL_PATH.write_text(
            "\n".join(
                [
                    "# UAOS V59 Final Seal",
                    "",
                    "UAOS V59 PASS",
                    "metadata-only: YES",
                    "dry-run-only: YES",
                    "manual-owner-input-required: YES",
                    "real owner approval applied: NO",
                    "auto-apply: NO",
                    "export allowed: NO",
                    "KORG output: NO",
                    "MIDI/audio generation: NO",
                    "USB write: NO",
                    "PA3X load: NO",
                    "source mutation: NO",
                    "App.jsx touched: NO",
                    "React integration: NO",
                    "deploy/payment: NO",
                    "compatibility claim: NO",
                    "PA3X-ready claim: NO",
                    "validator v6 result: PASS",
                    "commit hash if committed: pending",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    print(json.dumps(result, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
