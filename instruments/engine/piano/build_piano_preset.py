import json
from pathlib import Path

mapping = {
    "instrument": "UAOS Synthetic Piano",
    "version": "0.1",
    "license": "Original synthetic generated samples",
    "root_notes": []
}

for note in range(48, 73):
    mapping["root_notes"].append({
        "midi_note": note,
        "sample": f"samples/piano/piano_{note}.wav",
        "velocity_min": 1,
        "velocity_max": 127
    })

Path("instruments/presets").mkdir(parents=True, exist_ok=True)
Path("instruments/presets/uaos-synthetic-piano.json").write_text(
    json.dumps(mapping, indent=2),
    encoding="utf-8"
)

print("Preset created: instruments/presets/uaos-synthetic-piano.json")
