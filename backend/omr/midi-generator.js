import fs from 'fs';
import MidiWriter from 'midi-writer-js';

export async function generateMidiFromNotes(notes, output) {
  const track = new MidiWriter.Track();

  track.addEvent(
    notes.map((note) => new MidiWriter.NoteEvent({
      pitch: [note],
      duration: '4'
    }))
  );

  const writer = new MidiWriter.Writer(track);
  fs.writeFileSync(output, writer.buildFile());
}
