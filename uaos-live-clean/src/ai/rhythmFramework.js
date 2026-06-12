export const RHYTHMS = [
  { id: "four-four", meter: "4/4", accents: [0, 2], roles: ["dum", "tak"], tempoRange: [70, 150] },
  { id: "three-four", meter: "3/4", accents: [0], roles: ["dum", "tak"], tempoRange: [60, 140] },
  { id: "six-eight", meter: "6/8", accents: [0, 3], roles: ["dum", "tak"], tempoRange: [70, 170] },
  { id: "seven-eight", meter: "7/8", accents: [0, 3, 5], roles: ["dum", "tak"], tempoRange: [80, 180] },
  { id: "nine-eight", meter: "9/8", accents: [0, 2, 5, 7], roles: ["dum", "tak"], tempoRange: [70, 180] },
  { id: "maqsum-original", meter: "4/4", accents: [0, 2.5], roles: ["dum", "tak"], tempoRange: [80, 130], note: "Original UAOS metadata, no commercial style data." }
];

export function getRhythm(id) {
  return RHYTHMS.find((rhythm) => rhythm.id === id) || RHYTHMS[0];
}

