import pretty_midi
from pathlib import Path

midi = pretty_midi.PrettyMIDI()
piano = pretty_midi.Instrument(program=0, name="UAOS Piano Demo")

notes = [60, 64, 67, 72, 67, 64, 60]
time = 0

for n in notes:
    piano.notes.append(pretty_midi.Note(
        velocity=95,
        pitch=n,
        start=time,
        end=time + 0.45
    ))
    time += 0.5

midi.instruments.append(piano)

Path("instruments/engine/piano").mkdir(parents=True, exist_ok=True)
midi.write("instruments/engine/piano/demo.mid")

print("created instruments/engine/piano/demo.mid")
