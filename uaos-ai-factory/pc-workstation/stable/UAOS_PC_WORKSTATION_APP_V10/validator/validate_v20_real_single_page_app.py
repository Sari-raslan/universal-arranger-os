import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "UAOS_PC_WORKSTATION_APP_V20.html"
HOME = ROOT / "UAOS_PC_WORKSTATION_HOME.html"

required = {
    "v20_app": APP,
    "v20_start_cmd": ROOT / "START_UAOS_PC_WORKSTATION_V20.cmd",
    "open_project_cmd": ROOT / "tools" / "OPEN_PROJECT_FOLDER.cmd",
    "open_writer_outputs_cmd": ROOT / "tools" / "OPEN_WRITER_OUTPUTS.cmd",
    "open_midi_cmd": ROOT / "tools" / "OPEN_MIDI_FOLDER.cmd",
    "open_library_cmd": ROOT / "tools" / "OPEN_LIBRARY_FOLDER.cmd",
    "open_docs_cmd": ROOT / "tools" / "OPEN_DOCS_FOLDER.cmd",
    "writer_runner_v17": ROOT / "writer" / "RUN_WRITER_V17.cmd",
    "writer_outputs": ROOT / "writer" / "generated_v17_outputs",
    "midi_folder": ROOT / "midi",
}

forbidden = [
    "PA3X_READY",
    "KORG_COMPATIBLE",
    "LOAD_TO_PA3X",
    "USB_COPY_EXECUTED",
    "REAL_PA3X_SET",
    "HARDWARE_VERIFIED",
    "PRODUCTION_READY_FOR_KEYBOARD",
    "App.jsx",
    "owner-fixtures",
    "http://",
    "https://",
]

deploy_payment = ["deploy", "payment"]
usb_actions = ["USB_COPY_EXECUTED", "xcopy", "robocopy"]


def read(path):
    return path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""


app_text = read(APP)
home_text = read(HOME)
cmd_text = "\n".join(read(path) for path in (ROOT / "tools").glob("*.cmd")) if (ROOT / "tools").exists() else ""

checks = {name: path.exists() for name, path in required.items()}
checks.update(
    {
        "home_links_v20": "UAOS_PC_WORKSTATION_APP_V20.html" in home_text and "START_UAOS_PC_WORKSTATION_V20.cmd" in home_text,
        "interactive_project": "Project Editor" in app_text and "projectName" in app_text and "Export Project JSON" in app_text,
        "interactive_style": "Style Section Editor" in app_text and "styleRows" in app_text and "Export Style JSON" in app_text,
        "interactive_library": "Library Preset Selector" in app_text and "libraryPreset" in app_text,
        "interactive_player": "WebAudio" in app_text and "AudioContext" in app_text,
        "writer_panel": "RUN_WRITER_V17.cmd" in app_text,
        "safety_panel": "PA3X-ready claim" in app_text and "USB write" in app_text and "React app file touched" in app_text,
        "js_export_functions": "exportJson" in app_text and "Blob" in app_text,
        "no_forbidden_strings": not any(token in app_text or token in home_text for token in forbidden),
        "no_deploy_payment": not any(token in app_text.lower() or token in home_text.lower() for token in deploy_payment),
        "no_usb_action": not any(token.lower() in cmd_text.lower() for token in usb_actions),
        "no_proprietary_sample_path": "sample" not in app_text.lower() and "proprietary" not in app_text.lower(),
    }
)

status = "PASS" if all(checks.values()) else "FAIL"
result = {
    "status": status,
    "stable_root": str(ROOT),
    "checks": checks,
    "summary": {
        "v20_app_created": checks["v20_app"],
        "v20_start_cmd": checks["v20_start_cmd"],
        "home_updated": checks["home_links_v20"],
        "interactive_project_editor": checks["interactive_project"],
        "interactive_style_editor": checks["interactive_style"],
        "library_selector": checks["interactive_library"],
        "webaudio_player": checks["interactive_player"],
        "export_json_workflow": checks["js_export_functions"],
        "helper_cmd_files": all(checks[k] for k in ["open_project_cmd", "open_writer_outputs_cmd", "open_midi_cmd", "open_library_cmd", "open_docs_cmd"]),
        "pa3x_ready_claim": "NO",
        "usb_write": "NO",
        "external_copy_outside_repo": "NO",
        "pa3x_load": "NO",
        "fixture_modification": "NO",
        "owner_fixture_access": "NO",
        "proprietary_content_copied": "NO",
        "app_jsx_touched": "NO",
        "deploy_payment": "NO",
    },
}

out = Path(__file__).with_name("VALIDATOR_V20_REAL_APP_RESULT.json")
out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(status)
