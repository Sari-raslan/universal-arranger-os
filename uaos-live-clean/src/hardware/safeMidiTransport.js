export const MIDI_REALTIME = Object.freeze({
  CLOCK: 0xf8,
  START: 0xfa,
  CONTINUE: 0xfb,
  STOP: 0xfc,
});

export function clampInteger(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(number)));
}

export function createExternalClockPlan({
  bpm = 100,
  bars = 1,
  beatsPerBar = 4,
} = {}) {
  const safeBpm = clampInteger(bpm, 40, 240, 100);
  const safeBars = clampInteger(bars, 1, 8, 1);
  const safeBeatsPerBar = clampInteger(beatsPerBar, 1, 16, 4);
  const pulsesPerQuarter = 24;
  const pulseCount = safeBars * safeBeatsPerBar * pulsesPerQuarter;
  const pulseIntervalMs = 60000 / (safeBpm * pulsesPerQuarter);

  return {
    bpm: safeBpm,
    bars: safeBars,
    beatsPerBar: safeBeatsPerBar,
    pulsesPerQuarter,
    pulseCount,
    pulseIntervalMs,
    durationMs: pulseCount * pulseIntervalMs,
  };
}

export function sendAllNotesOff(
  output,
  { includeAllSoundOff = true, includeResetControllers = true } = {},
) {
  if (!output || typeof output.send !== "function") {
    throw new TypeError("A valid MIDI output is required.");
  }

  for (let channel = 0; channel < 16; channel += 1) {
    if (includeAllSoundOff) output.send([0xb0 | channel, 120, 0]);
    if (includeResetControllers) output.send([0xb0 | channel, 121, 0]);
    output.send([0xb0 | channel, 123, 0]);
  }
}

export function stopExternalClockTransport(output) {
  if (!output || typeof output.send !== "function") return;

  try {
    output.send([MIDI_REALTIME.STOP]);
    sendAllNotesOff(output);
    output.clear?.();
  } catch {
    // Cleanup is intentionally best-effort.
  }
}

function abortError() {
  if (typeof DOMException === "function") {
    return new DOMException("Clock transport cancelled.", "AbortError");
  }

  const error = new Error("Clock transport cancelled.");
  error.name = "AbortError";
  return error;
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

export async function runExternalClockTransport(output, options = {}) {
  if (!output || typeof output.send !== "function") {
    throw new TypeError("A valid MIDI output is required.");
  }

  const {
    bpm = 100,
    bars = 1,
    beatsPerBar = 4,
    signal,
    onProgress,
  } = options;

  const plan = createExternalClockPlan({ bpm, bars, beatsPerBar });
  const now = () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  let completed = false;

  try {
    output.send([MIDI_REALTIME.STOP]);
    await wait(120, signal);

    output.send([MIDI_REALTIME.START]);
    onProgress?.({ type: "start", plan });

    const startedAt = now();

    for (let index = 0; index < plan.pulseCount; index += 1) {
      if (signal?.aborted) throw abortError();

      output.send([MIDI_REALTIME.CLOCK]);

      const target = (index + 1) * plan.pulseIntervalMs;
      const remaining = target - (now() - startedAt);
      if (remaining > 0) await wait(remaining, signal);

      onProgress?.({
        type: "clock",
        index: index + 1,
        total: plan.pulseCount,
        plan,
      });
    }

    completed = true;
    return { ok: true, plan };
  } finally {
    output.send([MIDI_REALTIME.STOP]);
    sendAllNotesOff(output);
    output.clear?.();
    onProgress?.({ type: completed ? "stop" : "cancel", plan });
  }
}