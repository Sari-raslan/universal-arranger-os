const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createArrangementPlan,
  validateArrangementPlan
} = require("../backend/services/audioArrangementPlanner.js");

test("creates deterministic neutral arrangement plan", () => {
  const plan = createArrangementPlan({
    title: "Demo Song",
    bpm: 96,
    key: "D",
    scale: "minor",
    targetProfiles: ["korg-pa5x", "yamaha-genos"],
    sections: [
      { type: "intro", startBar: 1, lengthBars: 4, energy: 0.2 },
      { type: "verse", startBar: 5, lengthBars: 8, energy: 0.45 },
      { type: "chorus", startBar: 13, lengthBars: 8, energy: 0.85 },
      { type: "outro", startBar: 21, lengthBars: 4, energy: 0.3 }
    ]
  });

  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.title, "Demo Song");
  assert.equal(plan.bpm, 96);
  assert.equal(validateArrangementPlan(plan), true);
});

test("high energy chorus uses variation-4", () => {
  const plan = createArrangementPlan({
    bpm: 110,
    sections: [
      { type: "chorus", startBar: 1, lengthBars: 8, energy: 0.9 }
    ]
  });

  assert.deepEqual(plan.timeline[0].arrangerElements, ["variation-4"]);
});

test("proprietary SET export remains disabled", () => {
  const plan = createArrangementPlan({
    bpm: 100,
    sections: [{ type: "verse", startBar: 1, lengthBars: 8 }]
  });

  assert.equal(plan.capabilities.proprietarySetExport, false);
});

test("stem separation remains disabled", () => {
  const plan = createArrangementPlan({
    bpm: 100,
    sections: [{ type: "verse", startBar: 1, lengthBars: 8 }]
  });

  assert.equal(plan.capabilities.stemSeparation, false);
});

test("rejects overlapping sections", () => {
  assert.throws(
    () =>
      createArrangementPlan({
        bpm: 100,
        sections: [
          { type: "verse", startBar: 1, lengthBars: 8 },
          { type: "chorus", startBar: 8, lengthBars: 8 }
        ]
      }),
    /overlap/
  );
});

test("rejects invalid BPM", () => {
  assert.throws(
    () =>
      createArrangementPlan({
        bpm: 0,
        sections: [{ type: "verse", startBar: 1, lengthBars: 8 }]
      }),
    /bpm/
  );
});
