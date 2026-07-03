#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "05_uaos_set_project_v1"
OUT.mkdir(parents=True, exist_ok=True)
MARKERS = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER"]
project = {"markers": MARKERS, "project_name": "Sari UAOS PC Set V1", "format": "UAOS_FORMAT", "scope": "PC_ONLY", "status": "TEST_UNVERIFIED", "safety": {"not_for_pa3x_load": True, "not_for_usb_transfer": True, "pa3x_ready_claim": False, "korg_compatibility_claim": False}, "style_file": "SARI_ARABIC_POP_STYLE_V1.uaosstyle", "library_bindings": "SARI_LIBRARY_BINDINGS_V1.json"}
style = {"markers": MARKERS, "style_name": "Sari Arabic Pop Style V1", "genre": "Arabic Pop / Oriental Ballad", "tempo": 96, "meter": "4/4", "chords": ["Cm", "Ab", "Bb", "G7"], "sections": ["intro", "verse", "chorus", "fill", "ending"], "tracks": ["drums", "bass", "chords", "pad", "arabic_strings", "melody_guide"], "arranger_map": {"intro": {"bars": 4, "energy": "soft"}, "verse": {"bars": 8, "energy": "medium"}, "chorus": {"bars": 8, "energy": "wide"}, "fill": {"bars": 1, "energy": "accent"}, "ending": {"bars": 4, "energy": "resolved"}}, "safety": "PC_ONLY UAOS_FORMAT TEST_UNVERIFIED NOT_FOR_PA3X_LOAD NOT_FOR_USB_TRANSFER"}
bindings = {"markers": MARKERS, "bindings_name": "Sari Library Bindings V1", "style": "SARI_ARABIC_POP_STYLE_V1.uaosstyle", "track_bindings": {"drums": "UAOS Synthetic Pop Kit Placeholder", "bass": "UAOS Synthetic Finger Bass Placeholder", "chords": "UAOS Synthetic Warm Keys Placeholder", "pad": "Arabic Strings Pad Wide", "arabic_strings": "Arabic Strings Ensemble Soft", "melody_guide": "Arabic Violin Guide"}, "future_user_owned_samples_path_placeholder": "USER_OWNED_SAMPLES_ONLY/PLACEHOLDER", "proprietary_samples": "NONE"}
manifest = {"markers": MARKERS, "manifest_name": "UAOS Set Manifest", "project_name": project["project_name"], "files": ["SARI_UAOS_PC_SET_V1.uaosproj", "SARI_ARABIC_POP_STYLE_V1.uaosstyle", "SARI_LIBRARY_BINDINGS_V1.json"], "created_by": "uaos_pc_writer_v1.py", "safety": {"pc_only": True, "uaos_format": True, "test_unverified": True, "not_for_pa3x_load": True, "not_for_usb_transfer": True}}
def write_json(path, data): path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
write_json(OUT / "SARI_UAOS_PC_SET_V1.uaosproj", project)
write_json(OUT / "SARI_ARABIC_POP_STYLE_V1.uaosstyle", style)
write_json(OUT / "SARI_LIBRARY_BINDINGS_V1.json", bindings)
write_json(OUT / "UAOS_SET_MANIFEST.json", manifest)
print(json.dumps({"status": "PASS", "output": str(OUT), "markers": MARKERS}, indent=2))
