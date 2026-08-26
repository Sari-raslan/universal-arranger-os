import assert from "node:assert/strict";
import { runGoldenBrainSelfTest, createGoldenBrain, GOLDEN_BRAIN_CONTRACT } from "../backend/src/goldenBrain/goldenBrainCore.js";
import { runCrossProgramGoldenWorkflows } from "../backend/src/goldenBrain/programConsumers.js";
import { conversionGraphStatus, runConversion, planConversion } from "../backend/src/convert/conversionGraph.js";
import { listKnownFamilies } from "../backend/src/convert/familyAdapterContract.js";

const self = runGoldenBrainSelfTest();
assert.equal(self.ok, true, JSON.stringify(self));
assert.equal(GOLDEN_BRAIN_CONTRACT.capabilityId, "uaos.golden-brain.core/v1");

const brain = createGoldenBrain();
assert.equal(brain.detectMaqam({ melody: [60, 61, 64, 65, 67, 68] }).ok, true);
assert.equal(brain.suggestArrangement({}).ok, true);

const cross = runCrossProgramGoldenWorkflows();
assert.equal(cross.ok, true, JSON.stringify(cross.results));

const graph = conversionGraphStatus();
assert.equal(graph.ok, true);
assert.equal(graph.nByNHardcodedConverters, 0);
assert.ok(listKnownFamilies().length >= 6);

const midiMidi = runConversion({ sourceFamily: "midi", targetFamily: "midi" });
assert.equal(midiMidi.ok, true);

const midiKorg = planConversion({ sourceFamily: "midi", targetFamily: "korg" });
assert.equal(midiKorg.FORMAT_CONTRACT_REQUIRED, true);
assert.equal(midiKorg.writeAllowed, false);

console.log("golden-system.test.mjs: PASS", { cross: cross.pass, families: listKnownFamilies().length });
