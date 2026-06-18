import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("preview engine uses Web Audio only", () => {
  const source = fs.readFileSync(
    "uaos-live-clean/src/audio/neutralArrangementPreview.js",
    "utf8"
  );

  assert.match(source, /AudioContext/);
  assert.doesNotMatch(source, /navigator\.requestMIDIAccess/);
  assert.doesNotMatch(source, /\.send\(/);
  assert.doesNotMatch(source, /SysEx/i);
});

test("planner includes preview controls", () => {
  const planner = fs.readFileSync(
    "uaos-live-clean/src/components/AudioArrangementPlannerPanel.jsx",
    "utf8"
  );

  const component = fs.readFileSync(
    "uaos-live-clean/src/components/NeutralMidiPreview.jsx",
    "utf8"
  );

  assert.match(planner, /NeutralMidiPreview/);
  assert.match(planner, /sectionsJson=\{sectionsJson\}/);
  assert.match(component, /Preview Arrangement/);
  assert.match(component, /Stop Preview/);
});