export function classifySymbolsFromStaff(staffSegmentation) {
  const symbols = [];

  for (const system of staffSegmentation.systems) {
    symbols.push({
      type: 'clef',
      value: 'treble',
      confidence: 0.55,
      bbox: {
        x: 20,
        y: system.y + 10,
        width: 30,
        height: 80
      }
    });

    symbols.push({
      type: 'notehead',
      pitchGuess: 'C4',
      durationGuess: 'quarter',
      confidence: 0.50,
      bbox: {
        x: 120,
        y: system.y + 40,
        width: 16,
        height: 12
      }
    });

    symbols.push({
      type: 'notehead',
      pitchGuess: 'E4',
      durationGuess: 'quarter',
      confidence: 0.50,
      bbox: {
        x: 170,
        y: system.y + 32,
        width: 16,
        height: 12
      }
    });

    symbols.push({
      type: 'notehead',
      pitchGuess: 'G4',
      durationGuess: 'quarter',
      confidence: 0.50,
      bbox: {
        x: 220,
        y: system.y + 24,
        width: 16,
        height: 12
      }
    });
  }

  return symbols;
}
