export function createArrangementPlan(input) {
  const plan = {
    version: "uaos-arrangement-plan-v3",
    tempo: Number(input.tempo || 120),
    meter: input.meter || "4/4",
    key: input.key || "Unknown",
    structure: input.structure?.length ? input.structure : ["INTRO", "VARIATION_A", "FILL_1", "VARIATION_B", "ENDING"],
    genre: input.genre || "generic",
    density: clamp(input.density ?? 0.5, 0, 1),
    energyCurve: input.energyCurve || [0.3, 0.6, 0.8, 0.5],
    lanes: ["drums", "bass", "chord1", "pad", "lead"].map((lane) => ({ lane, role: lane, range: defaultRange(lane), regenerate: true })),
    fillPositions: [],
    constraints: input.constraints || {}
  };
  validateArrangementPlan(plan);
  return plan;
}

export function validateArrangementPlan(plan) {
  if (!plan?.version) throw new Error("Arrangement plan requires a version.");
  if (!Array.isArray(plan.structure) || !plan.structure.length) throw new Error("Arrangement plan requires structure.");
  if (!Array.isArray(plan.lanes) || !plan.lanes.length) throw new Error("Arrangement plan requires lanes.");
  return { ok: true };
}

function defaultRange(lane) {
  if (lane === "bass") return [36, 60];
  if (lane === "lead") return [60, 84];
  return [48, 76];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

