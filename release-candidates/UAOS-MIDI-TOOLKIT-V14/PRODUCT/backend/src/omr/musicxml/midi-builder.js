import fs from 'fs';
import MidiWriter from 'midi-writer-js';

function durationToMidi(duration) {
  if (duration === 'whole') return '1';
  if (duration === 'half') return '2';
  if (duration === 'eighth') return '8';
  return '4';
}

export function buildMidi(rhythmModel, outputPath) {
  const track = new MidiWriter.Track();

  track.setTempo(rhythmModel.tempo || 100);

  for (const note of rhythmModel.notes) {
    track.addEvent(new MidiWriter.NoteEvent({
      pitch: [note.pitch || 'C4'],
      duration: durationToMidi(note.duration)
    }));
  }

  const writer = new MidiWriter.Writer(track);
  fs.writeFileSync(outputPath, writer.buildFile());

  return outputPath;
}
