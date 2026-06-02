import librosa
import pretty_midi
import numpy as np

audio_path = 'input.wav'

y, sr = librosa.load(audio_path)

pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

midi = pretty_midi.PrettyMIDI()
instrument = pretty_midi.Instrument(program=0)

for t in range(pitches.shape[1]):
    index = magnitudes[:, t].argmax()
    pitch = pitches[index, t]

    if pitch > 0:
        note_number = int(librosa.hz_to_midi(pitch))

        note = pretty_midi.Note(
            velocity=100,
            pitch=note_number,
            start=t * 0.05,
            end=(t * 0.05) + 0.1
        )

        instrument.notes.append(note)

midi.instruments.append(instrument)
midi.write('output.mid')

print('UAOS MIDI export complete.')
