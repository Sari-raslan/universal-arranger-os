/**
 * Chord / style intelligence fields for Neutral IR — no fabricated vendor params.
 */
export function buildChordStyleSemantics({ golden = {}, midiIr = {} } = {}) {
  const chord = golden.detectedChord || golden.intent?.chord || null;
  return {
    schema: "uaos.neutral-ir.chord-style/v1",
    chordRecognitionMode: chord ? "DETECTED_FROM_MELODY" : "UNKNOWN",
    chordRoot: chord ? String(chord).replace(/[^A-G#b]/gi, "") || null : null,
    quality: null,
    extensions: [],
    inversion: null,
    bassNote: null,
    ntrNttIntent: null,
    scaleKey: golden.intent?.harmonyFamily || golden.harmonyFamily || null,
    maqamContext: /maqam|hijaz|nahawand|rast|bayati/i.test(String(golden.intent?.harmonyFamily || ""))
      ? golden.intent?.harmonyFamily || golden.harmonyFamily
      : null,
    styleFamily: golden.intent?.taste?.genres || golden.styleHint || null,
    groove: golden.intent?.groove || null,
    swing: null,
    density: null,
    energy: null,
    phraseBehavior: null,
    fabricatedVendorParameters: false,
    noteEventsAnalyzed: (midiIr.noteEvents || []).length
  };
}
