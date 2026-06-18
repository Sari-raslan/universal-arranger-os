const NOTE_OFFSETS = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11
};

function midiToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function getChordIntervals(scale) {
  const normalized = String(scale || "minor").toLowerCase();

  if (normalized === "major" || normalized === "rast") {
    return [0, 4, 7];
  }

  if (normalized === "hijaz") {
    return [0, 1, 7];
  }

  if (normalized === "bayati") {
    return [0, 2, 7];
  }

  return [0, 3, 7];
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section, index) => ({
      id: section?.id || `section-${index + 1}`,
      type: String(section?.type || `section-${index + 1}`),
      startBar: Math.max(1, Math.trunc(Number(section?.startBar) || 1)),
      lengthBars: Math.max(1, Math.trunc(Number(section?.lengthBars) || 1)),
      energy: Math.max(0, Math.min(1, Number(section?.energy ?? 0.5)))
    }))
    .sort((a, b) => a.startBar - b.startBar);
}

export function createNeutralArrangementPreview({
  bpm = 96,
  key = "C",
  scale = "minor",
  sections = []
} = {}) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio is not supported in this browser.");
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.14;
  master.connect(context.destination);

  const normalizedBpm = Math.max(20, Math.min(300, Number(bpm) || 96));
  const secondsPerBeat = 60 / normalizedBpm;
  const secondsPerBar = secondsPerBeat * 4;
  const normalizedSections = normalizeSections(sections);
  const root = 60 + (NOTE_OFFSETS[String(key)] ?? 0);
  const intervals = getChordIntervals(scale);
  const oscillators = [];
  const startAt = context.currentTime + 0.08;

  for (const section of normalizedSections) {
    for (let bar = 0; bar < section.lengthBars; bar += 1) {
      const barTime =
        startAt + (section.startBar - 1 + bar) * secondsPerBar;
      const duration = Math.max(0.12, secondsPerBar * 0.82);
      const velocity = 0.04 + section.energy * 0.055;

      intervals.forEach((interval, voiceIndex) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = voiceIndex === 0 ? "sine" : "triangle";
        oscillator.frequency.value = midiToFrequency(root + interval);

        gain.gain.setValueAtTime(0.0001, barTime);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.001, velocity),
          barTime + 0.03
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          barTime + duration
        );

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(barTime);
        oscillator.stop(barTime + duration + 0.05);
        oscillators.push(oscillator);
      });
    }
  }

  const endBar = normalizedSections.reduce(
    (max, section) =>
      Math.max(max, section.startBar - 1 + section.lengthBars),
    0
  );

  const durationSeconds = endBar * secondsPerBar;

  return {
    durationSeconds,
    stop() {
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // Already stopped.
        }
      });

      try {
        master.disconnect();
      } catch {
        // Already disconnected.
      }

      context.close().catch(() => {});
    }
  };
}