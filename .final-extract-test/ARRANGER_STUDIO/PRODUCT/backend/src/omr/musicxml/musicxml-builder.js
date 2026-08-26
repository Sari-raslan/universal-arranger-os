function durationToMusicXml(duration) {
  if (duration === 'whole') return 8;
  if (duration === 'half') return 4;
  if (duration === 'eighth') return 1;
  return 2;
}

function splitPitch(pitch) {
  const match = String(pitch || 'C4').match(/^([A-G])([#b]?)(\d)$/);
  if (!match) return { step: 'C', alter: '', octave: '4' };

  return {
    step: match[1],
    alter: match[2] === '#' ? '<alter>1</alter>' : match[2] === 'b' ? '<alter>-1</alter>' : '',
    octave: match[3]
  };
}

export function buildMusicXml(rhythmModel) {
  const notesXml = rhythmModel.notes.map((note) => {
    const pitch = splitPitch(note.pitch);
    const duration = durationToMusicXml(note.duration);

    return `
      <note>
        <pitch>
          <step>${pitch.step}</step>
          ${pitch.alter}
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>${note.duration}</type>
      </note>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>UAOS OMR</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      ${notesXml}
    </measure>
  </part>
</score-partwise>`;
}
