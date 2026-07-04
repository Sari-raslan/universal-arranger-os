import json
import struct
from datetime import datetime
from pathlib import Path


BASE = Path(__file__).resolve().parent
INPUT = BASE / "writer_input_default_v17.json"
OUT = BASE / "generated_v17_outputs"
SAFETY = [
    "PC_ONLY",
    "UAOS_FORMAT",
    "TEST_UNVERIFIED",
    "NOT_FOR_PA3X_LOAD",
    "NOT_FOR_USB_TRANSFER",
    "NOT_COMPATIBILITY_VERIFIED",
]


def require(data, keys):
    missing = [key for key in keys if key not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def write_json(path, payload):
    payload = {"safety_labels": SAFETY, "format": "UAOS_FORMAT", "status": "TEST_UNVERIFIED", **payload}
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def midi_varlen(value):
    buffer = value & 0x7F
    value >>= 7
    while value:
        buffer <<= 8
        buffer |= ((value & 0x7F) | 0x80)
        value >>= 7
    out = []
    while True:
        out.append(buffer & 0xFF)
        if buffer & 0x80:
            buffer >>= 8
        else:
            break
    return bytes(out)


def write_synthetic_midi(path, tempo):
    ticks = 480
    microseconds = int(60_000_000 / tempo)
    events = bytearray()
    events += b"\x00\xFF\x51\x03" + microseconds.to_bytes(3, "big")
    events += b"\x00\xFF\x58\x04\x04\x02\x18\x08"
    notes = [62, 58, 60, 57, 62, 65, 64, 62]
    for note in notes:
        events += midi_varlen(0) + bytes([0x90, note, 72])
        events += midi_varlen(ticks) + bytes([0x80, note, 0])
    events += b"\x00\xFF\x2F\x00"
    header = b"MThd" + struct.pack(">IHHH", 6, 0, 1, ticks)
    track = b"MTrk" + struct.pack(">I", len(events)) + bytes(events)
    path.write_bytes(header + track)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    require(data, ["project_name", "style_name", "tempo", "meter", "chords", "sections", "tracks", "arabic_strings_preset", "safety_labels"])

    project = {
        "project_name": data["project_name"],
        "style_name": data["style_name"],
        "tempo": data["tempo"],
        "meter": data["meter"],
        "tracks": data["tracks"],
        "notice": "PC-only UAOS internal project output. Synthetic/test-unverified."
    }
    style = {
        "style_name": data["style_name"],
        "tempo": data["tempo"],
        "meter": data["meter"],
        "chords": data["chords"],
        "sections": data["sections"],
        "notice": "UAOS PC style metadata output. No hardware file."
    }
    bindings = {
        "arabic_strings": data["arabic_strings_preset"],
        "pad": "Syrian Strings Emotional Pad",
        "melody_guide": "Arabic Violin Guide",
        "samples_included": "NO"
    }
    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "writer": "uaos_pc_workstation_writer_v17.py",
        "project_output": "SARI_UAOS_PC_WORKSTATION_V17.uaosproj",
        "style_output": "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.uaosstyle",
        "library_bindings": "SARI_ARABIC_STRINGS_LIBRARY_BINDINGS_V17.json",
        "midi_output": "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.mid",
        "output_scope": "writer/generated_v17_outputs only",
        "samples_included": "NO",
        "hardware_claim": "NO"
    }

    write_json(OUT / "SARI_UAOS_PC_WORKSTATION_V17.uaosproj", project)
    write_json(OUT / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.uaosstyle", style)
    write_json(OUT / "SARI_ARABIC_STRINGS_LIBRARY_BINDINGS_V17.json", bindings)
    write_json(OUT / "SARI_UAOS_PC_WORKSTATION_V17_MANIFEST.json", manifest)

    midi_status = "YES"
    try:
        write_synthetic_midi(OUT / "SARI_ARABIC_POP_ORIENTAL_BALLAD_V17.mid", int(data["tempo"]))
    except Exception as exc:
        midi_status = "SKIPPED"
        (OUT / "MIDI_SKIPPED_REPORT.md").write_text(
            "# MIDI Skipped Report\n\n"
            "Status: SKIPPED\n\n"
            f"Reason: {exc}\n\n"
            "Safety labels: " + ", ".join(SAFETY) + "\n",
            encoding="utf-8"
        )

    (OUT / "WRITER_V17_RUN_LOG.txt").write_text(
        "UAOS PC Workstation Writer V17\n"
        "Status: PASS\n"
        f"MIDI generated: {midi_status}\n"
        "Output folder: writer/generated_v17_outputs\n"
        "Safety labels: " + ", ".join(SAFETY) + "\n"
        "Samples included: NO\n"
        "External output path: NO\n",
        encoding="utf-8"
    )
    print(f"UAOS PC Workstation Writer V17 complete. MIDI generated: {midi_status}")


if __name__ == "__main__":
    main()
