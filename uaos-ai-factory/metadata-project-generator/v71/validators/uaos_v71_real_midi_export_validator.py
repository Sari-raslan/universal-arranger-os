import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIDI = ROOT / "midi" / "UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid"
FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".wav", ".mp3"}
forbidden_files = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTENSIONS]
data = MIDI.read_bytes() if MIDI.exists() else b""
result = {
    "validator_result": "PASS" if MIDI.exists() and data.startswith(b"MThd") and b"MTrk" in data and not forbidden_files else "FAIL",
    "version": "V71",
    "midi_exists": MIDI.exists(),
    "has_mthd": data.startswith(b"MThd"),
    "has_mtrk": b"MTrk" in data,
    "export_type": "MIDI_ONLY",
    "korg_files": forbidden_files,
    "usb_path": False,
    "pa3x_load": False,
    "appjsx_touched": False,
    "deploy_payment": False,
    "compatibility_claim": False
}
(ROOT / "generated" / "UAOS_V71_VALIDATOR_RESULTS.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if result["validator_result"] == "PASS" else 1)
