import React from 'react';
import * as Tone from 'tone';

export default function MidiPreview() {
  const play = async () => {
    await Tone.start();
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease('C4', '8n');
  };

  return (
    <div className="midiPreview">
      <button type="button" onClick={play}>
        Play MIDI Preview
      </button>
    </div>
  );
}
