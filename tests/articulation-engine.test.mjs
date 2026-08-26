import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadArticulationEngine } from "../backend/src/library/articulationEngine.js";

const ENGINE_PATH =
  "C:/UAOS-WT/uaos-open-library-factory-v3-20260723_185921/sound-library/articulations/uaos-articulation-engine.json";

test("articulation engine JSON loads and resolves triggers", () => {
  const doc = JSON.parse(fs.readFileSync(ENGINE_PATH, "utf8"));
  const engine = loadArticulationEngine(doc);
  assert.equal(engine.resolve({ overlap: true }), "legato");
  assert.equal(engine.resolve({ velocity: 120 }), "slide");
  assert.equal(engine.resolve({ grace: true }), "ornament");
  assert.equal(engine.resolve({ keyswitch: "C0" }), "tremolo");
  assert.equal(engine.resolve({ keyswitch: "D0" }), "fall");
  assert.equal(engine.resolve({ keyswitch: "E0" }), "scoop");
  assert.equal(engine.resolve({ velocity: 64 }), "none");
});

test("duplicate or empty rules fail closed", () => {
  assert.throws(() => loadArticulationEngine({ engine: "UAOS Articulation Engine", rules: [] }));
  assert.throws(() =>
    loadArticulationEngine({
      engine: "UAOS Articulation Engine",
      rules: [
        { name: "a", trigger: "x" },
        { name: "a", trigger: "y" }
      ]
    })
  );
});
