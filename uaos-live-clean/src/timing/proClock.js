export const PPQ = 480;

export function createClockState() {
  return {
    running: false,
    paused: false,
    bpm: 120,
    timeSignature: [4, 4],
    tick: 0,
    countInBars: 0,
    swing: 0,
    humanizeTicks: 0,
    tempoMap: []
  };
}

export function msPerTick(bpm = 120, ppq = PPQ) {
  return 60000 / Math.max(30, Math.min(260, Number(bpm) || 120)) / ppq;
}

export function positionFromTick(tick, timeSignature = [4, 4], ppq = PPQ) {
  const beatsPerBar = Number(timeSignature[0] || 4);
  const beat = Math.floor(tick / ppq) % beatsPerBar;
  const bar = Math.floor(tick / (ppq * beatsPerBar));
  return { bar: bar + 1, beat: beat + 1, tick: tick % ppq };
}

export function reduceClock(state, action) {
  const current = state || createClockState();
  switch (action.type) {
    case "start":
      return { ...current, running: true, paused: false, tick: action.fromTick ?? current.tick };
    case "stop":
      return { ...current, running: false, paused: false, tick: 0 };
    case "pause":
      return { ...current, running: false, paused: true };
    case "continue":
      return { ...current, running: true, paused: false };
    case "tempo":
      return { ...current, bpm: Math.max(30, Math.min(260, Number(action.bpm) || current.bpm)) };
    case "signature":
      return { ...current, timeSignature: [Math.max(1, Number(action.beats) || 4), Math.max(1, Number(action.unit) || 4)] };
    case "tick":
      return { ...current, tick: Math.max(0, current.tick + Math.max(0, Number(action.ticks) || 0)) };
    case "swing":
      return { ...current, swing: Math.max(0, Math.min(0.75, Number(action.swing) || 0)) };
    case "humanize":
      return { ...current, humanizeTicks: Math.max(0, Math.min(48, Number(action.ticks) || 0)) };
    default:
      return current;
  }
}

export function quantizeTick(tick, grid = 120) {
  const safeGrid = Math.max(1, Number(grid) || 120);
  return Math.round(tick / safeGrid) * safeGrid;
}

export function applySwing(tick, grid = 240, swing = 0) {
  const step = Math.floor(tick / grid);
  return step % 2 === 1 ? tick + Math.round(grid * Math.max(0, Math.min(0.75, swing)) / 2) : tick;
}

export function deterministicHumanize(tick, amount = 0, salt = 0) {
  if (!amount) return tick;
  const value = ((tick * 1103515245 + salt * 12345) >>> 0) % (amount * 2 + 1);
  return tick + value - amount;
}

export function scheduleWindow(events, { nowTick, lookAheadTicks = 960, bpm = 120, ppq = PPQ } = {}) {
  const endTick = nowTick + lookAheadTicks;
  return events
    .filter((event) => event.tick >= nowTick && event.tick < endTick)
    .map((event) => ({ ...event, delayMs: (event.tick - nowTick) * msPerTick(bpm, ppq) }));
}

