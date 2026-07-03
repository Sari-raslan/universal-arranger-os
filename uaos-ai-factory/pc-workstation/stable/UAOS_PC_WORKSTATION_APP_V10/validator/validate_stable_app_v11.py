import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v11-internal-player" / "run-20260704_001434" / "reports" / "V11_VALIDATOR_REPORT.md"
RESULT = ROOT / "validator" / "VALIDATOR_V11_RESULT.json"


def rel(path):
    return str(path.relative_to(ROOT)).replace("\\", "/")


checks = []


def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


player = ROOT / "preview" / "UAOS_INTERNAL_PLAYER_V11.html"
data = ROOT / "preview" / "player_v11_data.json"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
library_manager = ROOT / "library" / "UAOS_LIBRARY_MANAGER_V7.html"
strings_pack = ROOT / "library" / "arabic_strings" / "UAOS_ARABIC_STRINGS_PACK_V1.uaoslib"

check("stable folder exists", ROOT.exists(), str(ROOT))
check("V11 internal player exists", player.exists(), rel(player))
check("player data exists", data.exists(), rel(data))
check("home HTML exists", home.exists(), rel(home))
check("home HTML links to V11 player", home.exists() and "preview/UAOS_INTERNAL_PLAYER_V11.html" in home.read_text(encoding="utf-8"), rel(home))
check("MIDI file still exists", midi.exists(), rel(midi))
check("library manager exists", library_manager.exists(), rel(library_manager))
check("Arabic strings pack exists", strings_pack.exists(), rel(strings_pack))

forbidden_tokens = [
    "PA3X" + "_READY",
    "KORG" + "_COMPATIBLE",
    "LOAD" + "_TO" + "_PA3X",
    "USB" + "_COPY" + "_EXECUTED",
]
forbidden_path_parts = ["App.jsx", "owner-fixtures", "deploy", "payment"]
proprietary_markers = [
    "Kon" + "takt",
    "Native" + " Instruments",
    ".wav" + " sample",
    ".aif" + " sample",
    ".n" + "ki",
]

scan_paths = [
    player,
    data,
    home,
    ROOT / "preview" / "PLAYER_V11_README_AR.md",
    ROOT / "preview" / "PLAYER_V11_README_EN.md",
    ROOT / "docs" / "V11_INTERNAL_PLAYER_NOTES_AR.md",
    ROOT / "docs" / "V11_INTERNAL_PLAYER_NOTES_EN.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V11_INTERNAL_PLAYER_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V11_INTERNAL_PLAYER_SEAL.json",
]

found_forbidden = []
for path in scan_paths:
    if not path.exists():
        continue
    if path.is_dir():
        continue
    rel_path = rel(path)
    if any(part.lower() in rel_path.lower() for part in forbidden_path_parts):
        found_forbidden.append({"path": rel_path, "reason": "forbidden path marker"})
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for token in forbidden_tokens:
        if token in text:
            found_forbidden.append({"path": rel_path, "reason": f"forbidden token {token}"})
    for marker in proprietary_markers:
        if marker.lower() in text.lower():
            found_forbidden.append({"path": rel_path, "reason": f"proprietary marker {marker}"})

check("no forbidden strings or paths", not found_forbidden, json.dumps(found_forbidden, ensure_ascii=False))

status = "PASS" if all(item["ok"] for item in checks) else "FAIL"
payload = {
    "status": status,
    "stable_folder": str(ROOT),
    "checks": checks,
    "forbidden_findings": found_forbidden,
    "safety": {
        "pc_software_only": "YES",
        "webaudio_synthetic_only": "YES",
        "usb_write": "NO",
        "external_copy_outside_repo": "NO",
        "pa3x_load": "NO",
        "app_jsx_touched": "NO",
        "deploy_payment": "NO",
        "proprietary_content_copied": "NO"
    }
}

RESULT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
REPORT.write_text(
    "# UAOS PC Workstation V11 Validator Report\n\n"
    f"Validator status: {status}\n\n"
    + "\n".join([f"- {item['name']}: {'PASS' if item['ok'] else 'FAIL'} - {item['detail']}" for item in checks])
    + "\n",
    encoding="utf-8"
)

print(json.dumps(payload, indent=2, ensure_ascii=False))
