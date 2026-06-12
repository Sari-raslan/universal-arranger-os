export function exportMidiDraft(events){
  const midiEvents = events
    .filter(e => ["midi.noteon","voice.midi.draft","arranger.step"].includes(e.type))
    .map(e => ({
      time:e.time,
      type:e.type,
      note:e.payload.note || e.payload.midi,
      velocity:e.payload.velocity || 88,
      channel:e.payload.channel || 1
    }));

  return JSON.stringify({
    product:"UAOS",
    version:"1.13-midi-draft",
    format:"draft-json-not-standard-midi-yet",
    exportedAt:new Date().toISOString(),
    events:midiEvents
  }, null, 2);
}
