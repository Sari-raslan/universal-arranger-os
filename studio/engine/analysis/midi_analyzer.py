import pretty_midi
import sys
import json
from pathlib import Path

def analyze_midi(path):
    midi = pretty_midi.PrettyMIDI(path)
    result = {
        "file": str(path),
        "duration_seconds": midi.get_end_time(),
        "instruments": [],
        "estimated_tempo": midi.estimate_tempo()
    }

    for inst in midi.instruments:
        notes = []
        for n in inst.notes[:200]:
            notes.append({
                "pitch": n.pitch,
                "start": n.start,
                "end": n.end,
                "velocity": n.velocity
            })

        result["instruments"].append({
            "name": inst.name,
            "program": inst.program,
            "is_drum": inst.is_drum,
            "note_count": len(inst.notes),
            "preview_notes": notes
        })

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python midi_analyzer.py file.mid")
        sys.exit(1)

    path = Path(sys.argv[1])
    data = analyze_midi(str(path))

    out = path.with_suffix(".analysis.json")
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print("MIDI analysis complete:")
    print(out)
