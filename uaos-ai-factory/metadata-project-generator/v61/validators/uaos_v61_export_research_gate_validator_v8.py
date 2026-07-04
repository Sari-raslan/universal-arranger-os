import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT.parent
REPO_ROOT = ROOT.parents[2]
GENERATED = ROOT / "generated"
REPORTS = ROOT / "reports"
DASHBOARDS = ROOT / "dashboards"
OWNER = ROOT / "owner-decision"
FREEZE = ROOT / "freeze-candidate"
GATE = ROOT / "research-gate"
LOGS = ROOT / "logs"
RESULT_PATH = GENERATED / "UAOS_V61_EXPORT_RESEARCH_GATE_VALIDATOR_V8_RESULTS.json"
QA_PATH = REPORTS / "UAOS_V61_QA_REPORT.md"
DASHBOARD_MD_PATH = REPORTS / "UAOS_V61_OWNER_DASHBOARD.md"
DASHBOARD_HTML_PATH = DASHBOARDS / "UAOS_V61_OWNER_DASHBOARD.html"
SEAL_PATH = REPORTS / "UAOS_V61_FINAL_SEAL.md"

REQUIRED_JSON = {
    "final_pack": GENERATED / "UAOS_V61_OWNER_DECISION_FINALIZATION_PACK.json",
    "freeze_candidate": GENERATED / "UAOS_V61_STYLE_PLAN_FREEZE_CANDIDATE_DRYRUN_V1.json",
    "owner_form": OWNER / "UAOS_V61_OWNER_FINAL_DECISION_FORM.json",
    "freeze_trace": FREEZE / "UAOS_V61_STYLE_PLAN_FREEZE_CANDIDATE_TRACE.json",
    "research_gate": GATE / "UAOS_V61_EXPORT_RESEARCH_GATE_STATUS_BLOCKED.json",
}

REQUIRED_FILES = [
    OWNER / "UAOS_V61_OWNER_FINAL_DECISION_FORM_PRINTABLE.md",
    OWNER / "UAOS_V61_OWNER_FINAL_DECISION_GUIDE_AR.md",
    OWNER / "UAOS_V61_OWNER_FINAL_DECISION_GUIDE_EN.md",
    FREEZE / "UAOS_V61_STYLE_INTENT_FREEZE_CANDIDATE.md",
    FREEZE / "UAOS_V61_SECTION_PLAN_FREEZE_CANDIDATE.md",
    GATE / "UAOS_V61_EXPORT_RESEARCH_GATE_STATUS_BLOCKED.md",
    Path(__file__).resolve(),
    ROOT / "validators" / "UAOS_V61_VALIDATION_RULES.md",
    QA_PATH,
    DASHBOARD_MD_PATH,
    DASHBOARD_HTML_PATH,
    SEAL_PATH,
    LOGS / "UAOS_V61_BIG_RUN_LOG.txt",
]

V60_REFERENCES = [
    BASE / "v60" / "generated" / "UAOS_V60_OWNER_DECISION_SIMULATOR_RESULTS.json",
    BASE / "v60" / "generated" / "UAOS_V60_STYLE_EXPORT_REQUIREMENTS_MATRIX_DRYRUN_V1.json",
    BASE / "v60" / "generated" / "UAOS_V60_EXPORT_BLOCKER_VALIDATOR_V7_RESULTS.json",
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
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.relative_to(REPO_ROOT).as_posix()


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


def assert_false(data, field: str, errors: list[str], label: str):
    if data.get(field) is not False:
        errors.append(f"{label}.{field} must be false")


def assert_true(data, field: str, errors: list[str], label: str):
    if data.get(field) is not True:
        errors.append(f"{label}.{field} must be true")


def scan_text(path: Path, errors: list[str]):
    if path == RESULT_PATH or path.suffix.lower() == ".py":
        return
    if path.suffix.lower() not in {".json", ".md", ".html", ".txt"}:
        return
    text = path.read_text(encoding="utf-8", errors="ignore").lower()
    forbidden_claims = [
        "pa3x-ready",
        "korg compatible",
        "compatibility claim: yes",
        "export approved",
        "export_allowed\": true",
        "export allowed: yes",
        "real owner approved",
        "owner_final_decision_applied\": true",
        "owner final decision applied: yes",
        "auto applied",
        "auto-apply: yes",
        "generated midi",
        "generated audio",
        "generated korg output",
        "korg_output_allowed\": true",
        "usb_write_allowed\": true",
        "pa3x_load_allowed\": true",
        "real_owner_approval_applied\": true",
        "auto_apply_allowed\": true",
        "source_mutation_allowed\": true",
        "compatibility_claim\": true",
        "pa3x_ready_claim\": true",
    ]
    for claim in forbidden_claims:
        if claim in text:
            errors.append(f"Forbidden claim '{claim}' in {rel(path)}")


def scan_files(errors: list[str]):
    for path in list(ROOT.rglob("*")) + V60_REFERENCES:
        if not path.exists() or not path.is_file():
            continue
        suffix = path.suffix.lower()
        lower = str(path).lower()
        if suffix in FORBIDDEN_EXTENSIONS:
            errors.append(f"Forbidden output extension: {rel(path)}")
        if path.name.lower() == "app.jsx":
            errors.append(f"Forbidden App.jsx: {rel(path)}")
        if "\\deploy\\" in lower or "/deploy/" in lower:
            errors.append(f"Forbidden deploy path: {rel(path)}")
        if "\\payment\\" in lower or "/payment/" in lower:
            errors.append(f"Forbidden payment path: {rel(path)}")
        if "usb" in lower and ROOT in path.parents:
            errors.append(f"Forbidden USB path in V61: {rel(path)}")
        scan_text(path, errors)


def main():
    errors: list[str] = []
    warnings: list[str] = []
    parsed = {name: read_json(path, errors) for name, path in REQUIRED_JSON.items()}
    v60_parsed = [read_json(path, errors) for path in V60_REFERENCES]
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"Missing file: {rel(path)}")

    final_pack = parsed.get("final_pack")
    freeze = parsed.get("freeze_candidate")
    gate = parsed.get("research_gate")

    if final_pack:
        if final_pack.get("label") != "FINAL_OWNER_DECISION_INPUT_ONLY_NOT_APPLIED":
            errors.append("final_pack label is incorrect")
        assert_true(final_pack, "metadata_only", errors, "final_pack")
        assert_true(final_pack, "dry_run_only", errors, "final_pack")
        for field in [
            "real_owner_approval_applied",
            "owner_final_decision_applied",
            "export_allowed",
            "korg_output_allowed",
            "auto_apply_allowed",
            "source_mutation_allowed",
        ]:
            assert_false(final_pack, field, errors, "final_pack")
        choices = final_pack.get("final_owner_choices", [])
        if len(choices) != 5:
            errors.append("final_pack must contain 5 final owner choices")
        for choice in choices:
            if choice.get("label_required") != "FINAL_OWNER_DECISION_INPUT_ONLY_NOT_APPLIED":
                errors.append(f"{choice.get('choice_id')}.label_required is incorrect")
            if choice.get("selected") is not False:
                errors.append(f"{choice.get('choice_id')}.selected must be false")
            for field in ["real_owner_approval_applied", "export_allowed", "korg_output_allowed", "auto_apply_allowed", "source_mutation_allowed"]:
                if choice.get(field) is not False:
                    errors.append(f"{choice.get('choice_id')}.{field} must be false")

    if freeze:
        if freeze.get("label") != "FREEZE_CANDIDATE_METADATA_DRY_RUN_ONLY":
            errors.append("freeze_candidate label is incorrect")
        assert_true(freeze, "metadata_only", errors, "freeze_candidate")
        assert_true(freeze, "dry_run_only", errors, "freeze_candidate")
        assert_true(freeze, "freeze_candidate_only", errors, "freeze_candidate")
        for field in [
            "approved_production_data",
            "real_owner_approval_applied",
            "owner_final_decision_applied",
            "export_allowed",
            "korg_output_allowed",
            "auto_apply_allowed",
            "source_mutation_allowed",
            "compatibility_claim",
            "pa3x_ready_claim",
        ]:
            assert_false(freeze, field, errors, "freeze_candidate")
        no_output = freeze.get("no_output_proof", {})
        for key in ["midi", "audio", "korg", "native_keyboard_files", "usb", "pa3x_load"]:
            if no_output.get(key) is not False:
                errors.append(f"freeze_candidate.no_output_proof.{key} must be false")

    if gate:
        if gate.get("export_gate_status") != "RESEARCH_ONLY_BLOCKED":
            errors.append("research_gate.export_gate_status must be RESEARCH_ONLY_BLOCKED")
        for field in ["export_allowed", "owner_final_decision_applied", "korg_output_allowed", "real_owner_approval_applied", "auto_apply_allowed", "source_mutation_allowed"]:
            assert_false(gate, field, errors, "research_gate")

    for parsed_v60 in v60_parsed:
        if isinstance(parsed_v60, dict) and parsed_v60.get("status") == "FAIL":
            errors.append("Inherited V60 validator state is FAIL")

    for label, target in [
        ("V37 source project", BASE / "v37" / "generated" / "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
        ("V42 dry-run project", BASE / "v42" / "generated" / "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
        ("V44 dry-run project", BASE / "v44" / "generated" / "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"),
        ("V46 dry-run project", BASE / "v46" / "generated" / "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json"),
        ("App.jsx", REPO_ROOT / "uaos-ai-factory" / "pc-workstation" / "stable" / "UAOS_PC_WORKSTATION_APP_V10" / "App.jsx"),
    ]:
        if git_status_for(target):
            errors.append(f"{label} appears modified in git status")

    scan_files(errors)

    status = "PASS" if not errors else "FAIL"
    result = {
        "schema_version": "uaos.v61.export.research.gate.validator.v8.results.v1",
        "status": status,
        "export_gate_status": "RESEARCH_ONLY_BLOCKED",
        "export_allowed": False,
        "owner_final_decision_applied": False,
        "korg_output_allowed": False,
        "checked_files": {name: rel(path) for name, path in REQUIRED_JSON.items()},
        "v60_reference_count": len(v60_parsed),
        "errors": errors,
        "warnings": warnings,
        "safety": {
            "metadata_only": True,
            "dry_run_only": True,
            "owner_final_decision_input_only": True,
            "owner_final_decision_applied": False,
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
                    "# UAOS V61 QA Report",
                    "",
                    "Inputs read: V60 simulator results, requirements matrix, validator v7 results",
                    "Outputs created: YES",
                    "Owner finalization pack status: input-only generated",
                    "Style plan freeze candidate status: metadata dry-run generated",
                    "Export research gate status: RESEARCH_ONLY_BLOCKED",
                    "Validator v8 result: PASS",
                    "Forbidden output scan: PASS",
                    "Forbidden claim scan: PASS",
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
                    "# UAOS V61 Owner Dashboard",
                    "",
                    "V61 status: PASS",
                    "Final owner decision still manual only: YES",
                    "No final owner decision applied: YES",
                    "Freeze candidate is metadata-only: YES",
                    "Export research gate is blocked: YES",
                    "KORG output blocked: YES",
                    "Safe next step: V62 research-only documentation or stop.",
                    "",
                    "Main output paths:",
                    f"- {GENERATED / 'UAOS_V61_OWNER_DECISION_FINALIZATION_PACK.json'}",
                    f"- {GENERATED / 'UAOS_V61_STYLE_PLAN_FREEZE_CANDIDATE_DRYRUN_V1.json'}",
                    f"- {GENERATED / 'UAOS_V61_EXPORT_RESEARCH_GATE_VALIDATOR_V8_RESULTS.json'}",
                    "Validator: PASS",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        DASHBOARD_HTML_PATH.write_text(
            DASHBOARD_HTML_PATH.read_text(encoding="utf-8")
            .replace("Pending validator run.", "PASS.")
            .replace("Validator: pending", "Validator: PASS"),
            encoding="utf-8",
        )
        SEAL_PATH.write_text(
            "\n".join(
                [
                    "# UAOS V61 Final Seal",
                    "",
                    "UAOS V61 PASS",
                    "metadata-only: YES",
                    "dry-run-only: YES",
                    "owner-final-decision-input-only: YES",
                    "owner final decision applied: NO",
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
                    "validator v8 result: PASS",
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
