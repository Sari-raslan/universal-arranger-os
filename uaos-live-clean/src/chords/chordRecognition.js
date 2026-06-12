import { NOTE_NAMES } from "../core/music.js";

const QUALITIES = [
  ["maj7", [0, 4, 7, 11]],
  ["min7", [0, 3, 7, 10]],
  ["7", [0, 4, 7, 10]],
  ["dim", [0, 3, 6]],
  ["aug", [0, 4, 8]],
  ["sus2", [0, 2, 7]],
  ["sus4", [0, 5, 7]],
  ["6", [0, 4, 7, 9]],
  ["m", [0, 3, 7]],
  ["", [0, 4, 7]]
];

export function recognizeChord(notes = [], { splitPoint = 60, zone = "all" } = {}) {
  const filtered = notes.filter((note) => zone === "all" || (zone === "lower" ? note <= splitPoint : note > splitPoint));
  const pcs = [...new Set(filtered.map((note) => ((note % 12) + 12) % 12))];
  if (!pcs.length) return { symbol: "N.C.", root: null, quality: "none", confidence: 0, notes: filtered };

  for (const root of pcs) {
    const intervals = pcs.map((pc) => (pc - root + 12) % 12);
    for (const [quality, required] of QUALITIES) {
      if (required.every((interval) => intervals.includes(interval))) {
        const slash = filtered.length && filtered[0] % 12 !== root ? `/${NOTE_NAMES[((filtered[0] % 12) + 12) % 12]}` : "";
        return { symbol: `${NOTE_NAMES[root]}${quality}${slash}`, root, quality, confidence: Math.min(0.95, required.length / Math.max(required.length, pcs.length)), notes: filtered };
      }
    }
  }

  return { symbol: "Unknown", root: pcs[0], quality: "unknown", confidence: 0.25, notes: filtered };
}
