import json
import pretty_midi
import soundfile as sf
import numpy as np
from pathlib import Path

sr = 44100

def load_sample(path):
    audio, sample_rate = sf.read(path)
    if len(audio.shape) > 1:
        audio = audio.mean(axis=1)
    if sample_rate != sr:
        raise ValueError("Sample rate mismatch")
    return audio.astype(np.float32)

def render_midi_to_audio(midi_path, preset_path, output_path):
    preset = json.loads(Path(preset_path).read_text(encoding="utf-8"))
    sample_map = {}

    for item in preset["root_notes"]:
        sample_map[item["midi_note"]] = load_sample(Path("instruments") / item["sample"])

    midi = pretty_midi.PrettyMIDI(midi_path)
    duration = midi.get_end_time() + 4
    out = np.zeros(int(duration * sr), dtype=np.float32)

    for inst in midi.instruments:
        for note in inst.notes:
            pitch = note.pitch
            nearest = min(sample_map.keys(), key=lambda n: abs(n - pitch))
            sample = sample_map[nearest]

            speed = 2 ** ((pitch - nearest) / 12)
            idx = np.arange(0, len(sample), speed)
            shifted = np.interp(idx, np.arange(len(sample)), sample).astype(np.float32)

            start = int(note.start * sr)
            end = min(start + len(shifted), len(out))
            gain = note.velocity / 127
            out[start:end] += shifted[:end-start] * gain

    out = out / max(1.0, np.max(np.abs(out)))
    sf.write(output_path, out, sr)
    print("rendered", output_path)

if __name__ == "__main__":
    render_midi_to_audio(
        "instruments/engine/piano/demo.mid",
        "instruments/presets/uaos-synthetic-piano.json",
        "instruments/engine/piano/demo_render.wav"
    )
