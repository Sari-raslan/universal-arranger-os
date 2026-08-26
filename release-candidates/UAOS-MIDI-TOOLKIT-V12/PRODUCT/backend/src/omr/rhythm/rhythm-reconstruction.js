export function reconstructRhythm(symbols) {
  const notes = symbols
    .filter((symbol) => symbol.type === 'notehead')
    .map((symbol, index) => ({
      id: `note-${index + 1}`,
      pitch: symbol.pitchGuess || 'C4',
      duration: symbol.durationGuess || 'quarter',
      startBeat: index,
      voice: 1,
      confidence: symbol.confidence || 0.5
    }));

  return {
    timeSignature: '4/4',
    tempo: 100,
    notes
  };
}
