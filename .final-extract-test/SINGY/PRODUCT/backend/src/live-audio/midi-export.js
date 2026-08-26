import fs from 'node:fs';
import MidiWriter from 'midi-writer-js';

function durationToMidi(duration) {
  if (duration === 'whole') return '1';
  if (duration === 'half') return '2';
  if (duration === 'eighth') return '8';
  return '4';
}

export function melodyToMidi(melody, outputPath, tempo = 100) {
  const track = new MidiWriter.Track();
  track.setTempo(tempo);

  for (const note of melody) {
    track.addEvent(
      new MidiWriter.NoteEvent({
        pitch: [note.pitch || 'C4'],
        duration: durationToMidi(note.duration),
        velocity: note.velocity || 80
      })
    );
  }

  const writer = new MidiWriter.Writer(track);
  fs.writeFileSync(outputPath, writer.buildFile());

  return outputPath;
}
