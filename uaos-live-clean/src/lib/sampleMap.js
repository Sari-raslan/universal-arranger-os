export function normalizeSampleMap(payload) {
  const samples = Array.isArray(payload) ? payload : payload?.samples;

  if (!Array.isArray(samples)) {
    return [];
  }

  return samples
    .map((sample, index) => {
      const url = sample.url || (sample.file ? `/samples/${sample.file}` : null);
      if (!url) return null;

      return {
        id: sample.id || `sample-${index}`,
        name: sample.name || sample.file || `Sample ${index + 1}`,
        url,
        rootNote: Number(sample.rootNote ?? 60),
        lowNote: Number(sample.lowNote ?? 0),
        highNote: Number(sample.highNote ?? 127),
        velocityMin: Number(sample.velocityMin ?? 1),
        velocityMax: Number(sample.velocityMax ?? 127),
        channel: sample.channel == null ? null : Number(sample.channel),
        role: sample.role || sample.articulation || null
      };
    })
    .filter(Boolean);
}

export function chooseSampleForNote(samples, note, velocity = 100, channel = null, role = null) {
  return samples.find((sample) => {
    const noteMatches = note >= sample.lowNote && note <= sample.highNote;
    const velocityMatches = velocity >= sample.velocityMin && velocity <= sample.velocityMax;
    const channelMatches = sample.channel == null || channel == null || sample.channel === channel;
    const roleMatches = !sample.role || !role || sample.role === role;
    return noteMatches && velocityMatches && channelMatches && roleMatches;
  }) || null;
}

export function samplePlaybackRate(note, rootNote = 60) {
  return Math.pow(2, (note - rootNote) / 12);
}
