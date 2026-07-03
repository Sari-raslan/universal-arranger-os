#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "03_writer_engine_v2" / "generated_outputs"
OUT.mkdir(parents=True, exist_ok=True)
MARKERS = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
sections = [
    {"name": "intro", "bars": 4, "role": "establish groove"},
    {"name": "verse", "bars": 16, "role": "main vocal bed"},
    {"name": "chorus", "bars": 16, "role": "wide hook"},
    {"name": "fill", "bars": 1, "role": "transition accent"},
    {"name": "ending", "bars": 4, "role": "resolved close"},
]
tracks = {
    "drums": {"role": "rhythm foundation", "preset": "UAOS Synthetic Pop Kit Placeholder"},
    "bass": {"role": "root motion", "preset": "UAOS Synthetic Finger Bass Placeholder"},
    "chords": {"role": "harmony", "preset": "UAOS Synthetic Warm Keys Placeholder"},
    "pad": {"role": "wide support", "preset": "Arabic Strings Pad Wide"},
    "arabic_strings": {"role": "main Arabic color", "preset": "Arabic Strings Ensemble Soft"},
    "melody_guide": {"role": "original guide only", "preset": "Arabic Violin Guide"},
}
project = {"markers": MARKERS, "project_name": "Sari UAOS PC Set V2", "mood": "oriental_pop_ballad", "tempo": 96, "meter": "4/4", "style_file": "SARI_ARABIC_POP_STYLE_V2.uaosstyle", "library_bindings": "SARI_LIBRARY_BINDINGS_V2.json", "midi_preview_reference": "../../06_midi_preview/SARI_ARABIC_POP_STYLE_PREVIEW_V2.mid", "safety_labels": MARKERS}
style = {"markers": MARKERS, "style_name": "Sari Arabic Pop Style V2", "genre": "Arabic Pop / Oriental Ballad", "mood": "oriental_pop_ballad", "tempo": 96, "meter": "4/4", "chord_progression": ["Cm", "Ab", "Bb", "G7"], "sections": sections, "track_roles": tracks, "library_preset_references": {k: v["preset"] for k,v in tracks.items()}, "midi_preview_reference": "../../06_midi_preview/SARI_ARABIC_POP_STYLE_PREVIEW_V2.mid", "safety_labels": MARKERS}
bindings = {"markers": MARKERS, "bindings_name": "Sari Library Bindings V2", "track_bindings": tracks, "library_viewer_reference": "../../04_library_viewer/LIBRARY_VIEWER_DATA.json", "style_viewer_reference": "../../05_style_viewer/STYLE_VIEWER_DATA.json", "safety_labels": MARKERS}
manifest = {"markers": MARKERS, "manifest_name": "UAOS Set V2 Manifest", "files": ["SARI_UAOS_PC_SET_V2.uaosproj", "SARI_ARABIC_POP_STYLE_V2.uaosstyle", "SARI_LIBRARY_BINDINGS_V2.json"], "created_by": "uaos_pc_writer_v2.py", "safety_labels": MARKERS}
def write_json(name, data): (OUT / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
write_json("SARI_UAOS_PC_SET_V2.uaosproj", project)
write_json("SARI_ARABIC_POP_STYLE_V2.uaosstyle", style)
write_json("SARI_LIBRARY_BINDINGS_V2.json", bindings)
write_json("UAOS_SET_V2_MANIFEST.json", manifest)
print(json.dumps({"status": "PASS", "output": str(OUT)}, indent=2))
