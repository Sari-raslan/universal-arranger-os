/**
 * Converter dry-run tests
 */
import assert from "node:assert/strict";
import { runConverterDryRun, runConverterDryRunSuite } from "../backend/src/convert/dryRun.js";

const midi = runConverterDryRun({ family: "midi" });
assert.equal(midi.ok, true);
assert.equal(midi.dryRun, true);
assert.equal(midi.simulatedWritePerformed, false);
assert.equal(midi.roundtripOk, true);

const korg = runConverterDryRun({ family: "korg" });
assert.equal(korg.ok, true);
assert.equal(korg.writeAllowed, false);
assert.equal(korg.simulatedWritePerformed, false);
assert.ok(korg.writeBlockedReason);

const suite = runConverterDryRunSuite();
assert.equal(suite.ok, true);
assert.equal(suite.total, 6);

console.log("converter-dry-run.test.mjs: PASS", suite.summarySha256);
