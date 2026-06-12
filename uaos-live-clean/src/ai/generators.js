export function createRuleBasedGenerator() {
  return {
    id: "rule-based-v3",
    type: "local-rule-based",
    version: "3.0.0",
    capabilities: ["deterministic", "region-regeneration", "lane-regeneration", "range-safety"],
    generate(plan, { lane = null, region = null } = {}) {
      const lanes = lane ? plan.lanes.filter((item) => item.lane === lane) : plan.lanes;
      return lanes.flatMap((item, laneIndex) => generateLane(plan, item, laneIndex, region));
    }
  };
}

export function createMockAdapterForTests() {
  return { id: "mock-test-only", type: "mock", clearlyLabelled: true, generate: () => [] };
}

function generateLane(plan, lane, laneIndex, region) {
  const [low, high] = lane.range;
  const start = region?.startTick || 0;
  const end = region?.endTick || 1920;
  const step = lane.lane === "drums" ? 240 : 480;
  const events = [];
  for (let tick = start; tick < end; tick += step) {
    const note = low + ((tick / step + laneIndex * 3) % Math.max(1, high - low));
    events.push({ tick, lane: lane.lane, note, duration: Math.min(step, 360), velocity: 72 + Math.round(plan.density * 32), generator: "rule-based-v3" });
  }
  return events;
}

export function validateGeneratedMidi(events, plan) {
  for (const event of events) {
    const lane = plan.lanes.find((item) => item.lane === event.lane);
    if (!lane) return { ok: false, error: `Unknown lane ${event.lane}` };
    if (event.note < lane.range[0] || event.note > lane.range[1]) return { ok: false, error: `Note out of range for ${event.lane}` };
    if (event.duration <= 0) return { ok: false, error: "Invalid duration" };
  }
  return { ok: true };
}

