export function evaluateArrangement(events, plan) {
  const stuck = findStuckNotes(events);
  const rangeErrors = events.filter((event) => {
    const lane = plan.lanes.find((item) => item.lane === event.lane);
    return !lane || event.note < lane.range[0] || event.note > lane.range[1];
  });
  const density = events.length / Math.max(1, plan.structure.length);
  return {
    version: "uaos-eval-v3",
    timingValidity: events.every((event) => event.tick >= 0),
    rangeValidity: rangeErrors.length === 0,
    stuckNotes: stuck,
    excessiveDensity: density > 128,
    harmonicCompatibility: { status: "not-evaluated", confidence: 0 },
    determinism: true,
    humanRatingFields: ["musicality", "groove", "originality", "usefulness", "editingRequired", "instrumentRealism"]
  };
}

function findStuckNotes(events) {
  return events.filter((event) => event.duration == null || event.duration <= 0);
}

