import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT.parent
REPO_ROOT = ROOT.parents[2]
GENERATED = ROOT / "generated"
REPORTS = ROOT / "reports"
DASHBOARDS = ROOT / "dashboards"
SIMULATOR = ROOT / "simulator"
REQUIREMENTS = ROOT / "requirements"
LOGS = ROOT / "logs"
RESULT_PATH = GENERATED / "UAOS_V60_EXPORT_BLOCKER_VALIDATOR_V7_RESULTS.json"
QA_PATH = REPORTS / "UAOS_V60_QA_REPORT.md"
DASHBOARD_MD_PATH = REPORTS / "UAOS_V60_OWNER_DASHBOARD.md"
DASHBOARD_HTML_PATH = DASHBOARDS / "UAOS_V60_OWNER_DASHBOARD.html"
SEAL_PATH = REPORTS / "UAOS_V60_FINAL_SEAL.md"

REQUIRED_JSON = {
    "simulator": GENERATED / "UAOS_V60_OWNER_DECISION_SIMULATOR_RESULTS.json",
    "matrix_generated": GENERATED / "UAOS_V60_STYLE_EXPORT_REQUIREMENTS_MATRIX_DRYRUN_V1.json",
    "simulator_trace": SIMULATOR / "UAOS_V60_OWNER_DECISION_SIMULATOR_TRACE.json",
    "matrix_requirements": REQUIREMENTS / "UAOS_V60_STYLE_EXPORT_REQUIREMENTS_MATRIX_DRYRUN_V1.json",
}

REQUIRED_FILES = [
    SIMULATOR / "UAOS_V60_OWNER_DECISION_SIMULATOR_SCENARIOS.md",
    REQUIREMENTS / "UAOS_V60_STYLE_EXPORT_REQUIREMENTS_MATRIX_DRYRUN_V1.md",
    REQUIREMENTS / "UAOS_V60_BLOCKED_EXPORT_REQUIREMENTS_REVIEW_GUIDE_AR.md",
    REQUIREMENTS / "UAOS_V60_BLOCKED_EXPORT_REQUIREMENTS_REVIEW_GUIDE_EN.md",
    Path(__file__).resolve(),
    ROOT / "validators" / "UAOS_V60_VALIDATION_RULES.md",
    QA_PATH,
    DASHBOARD_MD_PATH,
    DASHBOARD_HTML_PATH,
    SEAL_PATH,
    LOGS / "UAOS_V60_BIG_RUN_LOG.txt",
]

V59_REFERENCES = [
    BASE / "v59" / "generated" / "UAOS_V59_OWNER_DECISION_NORMALIZED_PENDING.json",
    BASE / "v59" / "generated" / "UAOS_V59_STYLE_PLAN_CONSOLIDATION_DRYRUN_V5.json",
    BASE / "v59" / "roadmap" / "UAOS_V59_EXPORT_READINESS_ROADMAP_BLOCKED.md",
    BASE / "v59" / "generated" / "UAOS_V59_EXPORT_READINESS_ROADMAP_VALIDATOR_V6_RESULTS.json",
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
        "export approved",
        "pa3x ready",
        "korg compatible",
        "real owner approved",
        "auto-applied",
        "generated midi",
        "generated audio",
        "generated korg output",
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
    for claim in forbidden_claims:
        if claim in text:
            errors.append(f"Forbidden claim '{claim}' in {rel(path)}")


def scan_files(errors: list[str]):
    for path in list(ROOT.rglob("*")) + V59_REFERENCES:
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
            errors.append(f"Forbidden USB path in V60: {rel(path)}")
        scan_text(path, errors)


def main():
    errors: list[str] = []
    warnings: list[str] = []
    parsed = {name: read_json(path, errors) for name, path in REQUIRED_JSON.items()}
    v59_parsed = [read_json(path, errors) if path.suffix.lower() == ".json" else path.read_text(encoding="utf-8") for path in V59_REFERENCES]
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"Missing file: {rel(path)}")

    simulator = parsed.get("simulator")
    matrix = parsed.get("matrix_generated")
    matrix_requirements = parsed.get("matrix_requirements")

    if simulator:
        if simulator.get("simulation_label") != "SIMULATION_ONLY_NOT_OWNER_DECISION":
            errors.append("simulator simulation label is missing")
        assert_true(simulator, "metadata_only", errors, "simulator")
        assert_true(simulator, "dry_run_only", errors, "simulator")
        for field in ["real_owner_approval_applied", "export_allowed", "korg_output_allowed", "auto_apply_allowed", "source_mutation_allowed"]:
            assert_false(simulator, field, errors, "simulator")
        scenarios = simulator.get("scenarios", [])
        if len(scenarios) < 3:
            errors.append("simulator must include at least 3 scenarios")
        for scenario in scenarios:
            if scenario.get("simulation_label") != "SIMULATION_ONLY_NOT_OWNER_DECISION":
                errors.append(f"{scenario.get('scenario_id')}.simulation_label missing")
            for field in ["real_owner_approval_applied", "export_allowed", "korg_output_allowed", "auto_apply_allowed", "source_mutation_allowed"]:
                if scenario.get(field) is not False:
                    errors.append(f"{scenario.get('scenario_id')}.{field} must be false")

    for label, data in [("matrix_generated", matrix), ("matrix_requirements", matrix_requirements)]:
        if data:
            assert_true(data, "metadata_only", errors, label)
            assert_true(data, "dry_run_only", errors, label)
            for field in ["export_allowed", "korg_output_allowed", "midi_generation_allowed", "audio_render_allowed", "compatibility_claim", "pa3x_ready_claim"]:
                assert_false(data, field, errors, label)
            for section in data.get("section_requirements", []):
                if section.get("export_status") != "BLOCKED_NO_EXPORT_ALLOWED":
                    errors.append(f"{label}.{section.get('section_id')}.export_status must be BLOCKED_NO_EXPORT_ALLOWED")
                for field in ["generated_midi", "generated_audio", "generated_korg_output", "compatibility_claim", "pa3x_ready_claim"]:
                    if section.get(field) is not False:
                        errors.append(f"{label}.{section.get('section_id')}.{field} must be false")

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
        "schema_version": "uaos.v60.export.blocker.validator.v7.results.v1",
        "status": status,
        "checked_files": {name: rel(path) for name, path in REQUIRED_JSON.items()},
        "v59_reference_count": len(v59_parsed),
        "errors": errors,
        "warnings": warnings,
        "safety": {
            "metadata_only": True,
            "dry_run_only": True,
            "simulation_only": True,
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
                    "# UAOS V60 QA Report",
                    "",
                    "Inputs read: V59 normalized decisions, style consolidation dry-run v5, blocked roadmap, validator v6 results",
                    "Outputs created: YES",
                    "Simulator status: simulation-only generated",
                    "Requirements matrix status: metadata dry-run generated",
                    "Export blocker status: export remains blocked",
                    "Validator v7 result: PASS",
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
                    "# UAOS V60 Owner Dashboard",
                    "",
                    "V60 status: PASS",
                    "Simulation only: YES",
                    "No real owner decision applied: YES",
                    "Requirements matrix created: YES",
                    "Export still blocked: YES",
                    "KORG output blocked: YES",
                    "Safe next step: V61 research-only export format documentation or stop.",
                    "",
                    "Main output paths:",
                    f"- {GENERATED / 'UAOS_V60_OWNER_DECISION_SIMULATOR_RESULTS.json'}",
                    f"- {GENERATED / 'UAOS_V60_STYLE_EXPORT_REQUIREMENTS_MATRIX_DRYRUN_V1.json'}",
                    f"- {GENERATED / 'UAOS_V60_EXPORT_BLOCKER_VALIDATOR_V7_RESULTS.json'}",
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
                    "# UAOS V60 Final Seal",
                    "",
                    "UAOS V60 PASS",
                    "metadata-only: YES",
                    "dry-run-only: YES",
                    "simulation-only: YES",
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
                    "validator v7 result: PASS",
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
