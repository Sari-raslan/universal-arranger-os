/**
 * Tonal context preservation and alternative scoring for Musical Brain / Arranger.
 * Style may change. Unrequested reharmonization of the source melody/harmony must not.
 */
export const HIJAZ_PITCH_CLASSES = Object.freeze([0, 1, 4, 5, 7, 8]);

export function pitchClasses(midiList = []) {
  return [...new Set(midiList.map((n) => ((Number(n) % 12) + 12) % 12))].sort((a, b) => a - b);
}

export function detectHarmonyFamily(pcs) {
  const set = new Set(pcs);
  const hijaz = HIJAZ_PITCH_CLASSES.every((p) => set.has(p)) || (
    set.has(0) && set.has(1) && set.has(4) && set.has(7)
  );
  const majorDiatonic = set.has(0) && set.has(2) && set.has(4) && set.has(7) && set.has(9) && !set.has(1);
  if (hijaz && !majorDiatonic) return "maqam-hijaz";
  if (majorDiatonic) return "major-pop";
  return "unknown";
}

export function scoreAlternative(source, candidate, { ownerRequestedReharmonization = false } = {}) {
  const sourcePcs = pitchClasses(source.melody || []);
  const candidatePcs = pitchClasses(candidate.melody || []);
  const sourceFamily = source.harmonyFamily || detectHarmonyFamily(sourcePcs);
  const candidateFamily = candidate.harmonyFamily || detectHarmonyFamily(candidatePcs);
  const preserved = sourcePcs.filter((p) => candidatePcs.includes(p));
  const missing = sourcePcs.filter((p) => !candidatePcs.includes(p));
  const foreign = candidatePcs.filter((p) => !sourcePcs.includes(p));
  const unrequestedReharmonization =
    !ownerRequestedReharmonization &&
    (foreign.length > 0 || (sourceFamily === "maqam-hijaz" && candidateFamily === "major-pop"));
  const melodyChordHits = (candidate.melody || []).filter((midi) => {
    const pc = ((Number(midi) % 12) + 12) % 12;
    return sourcePcs.includes(pc);
  }).length;
  const melodyChordCompatibility = (candidate.melody || []).length
    ? melodyChordHits / candidate.melody.length
    : 0;

  let score = 100;
  score -= foreign.length * 28;
  score -= missing.length * 12;
  score -= Math.round((1 - melodyChordCompatibility) * 40);
  if (unrequestedReharmonization) score -= 80;
  if (sourceFamily === candidateFamily) score += 8;
  score = Math.max(0, Math.min(100, score));

  return {
    ok: score >= 55 && !unrequestedReharmonization && foreign.length === 0,
    score,
    sourceFamily,
    candidateFamily,
    preserved,
    missing,
    foreign,
    melodyChordCompatibility,
    unrequestedReharmonization,
    tonalContextPreserved: foreign.length === 0 && missing.length <= 1,
    harmonicCompatibility: sourceFamily === candidateFamily || (!unrequestedReharmonization && foreign.length === 0),
    styleChangeWithoutUnrequestedReharmonization: candidate.styleChanged === true && !unrequestedReharmonization
  };
}

export function proposeCompatibleAlternative(source, styleShift = {}) {
  return {
    melody: [...(source.melody || [])],
    chords: source.chords,
    harmonyFamily: source.harmonyFamily || detectHarmonyFamily(pitchClasses(source.melody || [])),
    groove: styleShift.groove || "arabic-khaleeji-fill",
    tempo: styleShift.tempo || 92,
    styleChanged: true,
    reharmonized: false
  };
}
