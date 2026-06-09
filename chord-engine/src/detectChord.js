export function detectChord(notes = []) {
  const unique = [...new Set(notes.map(Number))].sort((a, b) => a - b);
  if (unique.length < 3) return { type: "unknown", notes: unique };
  const root = unique[0];
  const intervals = unique.map(n => (n - root + 12) % 12);

  if (intervals.includes(4) && intervals.includes(7) && intervals.includes(10)) {
    return { root, type: "dominant7", symbol: `${root}:7`, notes: unique };
  }
  if (intervals.includes(4) && intervals.includes(7)) {
    return { root, type: "major", symbol: `${root}:maj`, notes: unique };
  }
  if (intervals.includes(3) && intervals.includes(7)) {
    return { root, type: "minor", symbol: `${root}:min`, notes: unique };
  }
  if (intervals.includes(5) && intervals.includes(7)) {
    return { root, type: "sus4", symbol: `${root}:sus4`, notes: unique };
  }
  return { root, type: "custom", notes: unique };
}
