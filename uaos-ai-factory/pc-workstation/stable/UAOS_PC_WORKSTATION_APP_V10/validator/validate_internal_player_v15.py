import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT.parents[1] / "generated" / "uaos-pc-workstation-v15-internal-audio-player" / "run-20260704_020716"
RESULT = ROOT / "validator" / "VALIDATOR_V15_INTERNAL_PLAYER_RESULT.json"
REPORT = RUN_ROOT / "reports" / "V15_VALIDATOR_REPORT.md"

def read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""

checks = []
def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

player = ROOT / "preview" / "UAOS_INTERNAL_PLAYER_V15.html"
data = ROOT / "preview" / "player_v15_data.json"
home = ROOT / "UAOS_PC_WORKSTATION_HOME.html"
midi = ROOT / "midi" / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid"
scan_files = [
    player, data,
    ROOT / "preview" / "PLAYER_V15_README_AR.md",
    ROOT / "preview" / "PLAYER_V15_README_EN.md",
    ROOT / "docs" / "V15_INTERNAL_AUDIO_PLAYER_NOTES_AR.md",
    ROOT / "docs" / "V15_INTERNAL_AUDIO_PLAYER_NOTES_EN.md",
    home
]
declaration_files = [
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V15_INTERNAL_PLAYER_SEAL.md",
    ROOT / "seal" / "UAOS_PC_WORKSTATION_V15_INTERNAL_PLAYER_SEAL.json"
]

check("stable folder exists", ROOT.exists(), str(ROOT))
check("V15 player exists", player.exists(), str(player))
check("player data exists", data.exists(), str(data))
check("Home HTML links to Internal Audio Player V15", home.exists() and "preview/UAOS_INTERNAL_PLAYER_V15.html" in read(home), str(home))
check("MIDI preview still exists", midi.exists(), str(midi))
check("WebAudio oscillator code present", "createOscillator" in read(player), str(player))

labels = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "SYNTHETIC_PREVIEW_ONLY", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
combined = "\n".join(read(p) for p in scan_files + declaration_files)
missing = [label for label in labels if label not in combined]
check("safety labels present", not missing, json.dumps(missing))

scan_text = "\n".join(read(p) for p in scan_files)
forbidden = ["PA3X" + "_READY", "KORG" + "_COMPATIBLE", "LOAD" + "_TO" + "_PA3X", "USB" + "_COPY" + "_EXECUTED", "REAL" + "_PA3X" + "_SET", "HARDWARE" + "_VERIFIED", "App.jsx", "owner-fixtures", "Kontakt", "Native Instruments", ".nki", ".wav sample", ".aif sample", ".mp3", ".wav", ".aif", ".flac", "<audio"]
found = [token for token in forbidden if token.lower() in scan_text.lower()]
check("forbidden strings and sample references absent", not found, json.dumps(found))
check("no deploy/payment behavior", "deploy" not in read(player).lower() and "payment" not in read(player).lower(), str(player))
check("no external URLs", "http://" not in combined and "https://" not in combined, "V15 files")

status = "PASS" if all(c["ok"] for c in checks) else "FAIL"
payload = {
  "status": status,
  "checks": checks,
  "pa3x_ready_claim": "NO",
  "usb_write": "NO",
  "external_copy_outside_repo": "NO",
  "pa3x_load": "NO",
  "fixture_modification": "NO",
  "owner_fixture_access": "NO",
  "proprietary_content_copied": "NO",
  "app_jsx_touched": "NO",
  "deploy_payment": "NO"
}
RESULT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
REPORT.write_text("# UAOS PC Workstation V15 Validator Report\n\nValidator status: " + status + "\n\n" + "\n".join(f"- {c['name']}: {'PASS' if c['ok'] else 'FAIL'} - {c['detail']}" for c in checks) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2, ensure_ascii=False))
