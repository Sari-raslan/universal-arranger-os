export function exportMidiDraft(project){
  const song = project?.song?.song || [];
  let time = 0;
  const events = [];

  for (const part of song) {
    events.push({
      time,
      type: "section",
      section: part.section,
      chord: part.chord,
      bars: part.bars
    });

    time += (part.bars || 1) * 4;
  }

  return {
    ok: true,
    format: "uaos-midi-draft-json",
    ppq: 480,
    tempo: project?.state?.tempo || 120,
    events
  };
}
