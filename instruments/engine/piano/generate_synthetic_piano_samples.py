import numpy as np
import soundfile as sf
from pathlib import Path

OUT = Path('instruments/samples/piano')
OUT.mkdir(parents=True, exist_ok=True)

sr = 44100

def midi_to_freq(note):
    return 440.0 * (2 ** ((note - 69) / 12))

def make_piano_note(note, velocity=100, duration=3.5):
    freq = midi_to_freq(note)
    t = np.linspace(0, duration, int(sr * duration), False)

    # synthetic piano-like tone: attack + harmonics + decay
    attack = np.minimum(t / 0.02, 1.0)
    decay = np.exp(-t * 1.8)

    tone = (
        1.00 * np.sin(2 * np.pi * freq * t) +
        0.45 * np.sin(2 * np.pi * freq * 2 * t) +
        0.22 * np.sin(2 * np.pi * freq * 3 * t) +
        0.10 * np.sin(2 * np.pi * freq * 4.01 * t)
    )

    hammer = 0.08 * np.random.randn(len(t)) * np.exp(-t * 40)
    audio = (tone + hammer) * attack * decay
    audio = audio / max(0.001, np.max(np.abs(audio)))
    audio *= velocity / 127 * 0.7

    return audio.astype(np.float32)

for note in range(48, 73):
    audio = make_piano_note(note)
    filename = OUT / f'piano_{note}.wav'
    sf.write(filename, audio, sr)
    print('created', filename)

print('UAOS synthetic piano sample set complete.')
