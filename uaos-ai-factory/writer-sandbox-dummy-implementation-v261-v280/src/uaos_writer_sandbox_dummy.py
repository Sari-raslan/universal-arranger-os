from pathlib import Path
import argparse, json, datetime
from uaos_writer_sandbox_mapping import build_dummy_mapping
from uaos_writer_sandbox_safety import MARKER, assert_safe_output_path, marker_payload, SandboxSafetyError


def write_text(path: Path, text: str) -> None:
    assert_safe_output_path(path)
    path.write_text(text, encoding="utf-8")


def write_json(path: Path, payload: dict) -> None:
    assert_safe_output_path(path)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_sandbox(style_source: str, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    sandbox_json = output_dir / "UAOS_DUMMY_WRITER_OUTPUT.uaoswriter-sandbox.json"
    dummy_bin = output_dir / "UAOS_DUMMY_WRITER_OUTPUT.uaos-dummybin"
    report_md = output_dir / "UAOS_DUMMY_WRITER_REPORT.uaoswriter-report.md"
    manifest_json = output_dir / "UAOS_DUMMY_WRITER_OUTPUT_MANIFEST.json"
    mapping = build_dummy_mapping(style_source)
    payload = {
        "marker": MARKER,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sandbox_type": "UAOS_DUMMY_SANDBOX_ONLY",
        "not_keyboard_loadable": True,
        "real_writer_implemented": False,
        "real_keyboard_output": False,
        "style_source_reference": style_source,
        "mapping": mapping,
    }
    write_json(sandbox_json, payload)
    write_text(dummy_bin, marker_payload("DUMMY_BINARY_PLACEHOLDER_FOR_VALIDATOR_ONLY"))
    write_text(report_md, f"# UAOS Dummy Writer Report\n\n{MARKER}\n\nDummy sandbox only. Real writer implemented: NO. Real keyboard output: NO.\n")
    manifest = {
        "marker": MARKER,
        "outputs": [str(sandbox_json), str(dummy_bin), str(report_md)],
        "allowed_extensions_only": True,
        "real_writer_implemented": False,
        "real_keyboard_output": False,
    }
    manifest_json.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="UAOS safe dummy writer sandbox")
    parser.add_argument("--style-source", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args(argv)
    try:
        manifest = run_sandbox(args.style_source, Path(args.output_dir))
    except SandboxSafetyError as exc:
        print(f"BLOCKED: {exc}")
        return 2
    print(json.dumps(manifest, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
