import test from "node:test";
import assert from "node:assert/strict";
import { inspectBuffer, familySupportMatrix, canClaim, familyFromExtension } from "../backend/src/convert/uaosNeutralIr.js";
import { inspectSysex } from "../backend/src/convert/familyAdapters.js";

test("SysEx inspect counts F0/F7 and never claims write", () => {
  const buf = Buffer.from([0xf0, 0x42, 0x00, 0x01, 0xf7, 0xf0, 0x43, 0x02, 0xf7]);
  const inspected = inspectSysex(buf);
  assert.equal(inspected.blockCount, 2);
  assert.equal(inspected.level, "INSPECT");
  assert.equal(inspected.write, "HARDWARE_REQUIRED");
  const viaEngine = inspectBuffer(buf, ".syx");
  assert.equal(viaEngine.blockCount, 2);
  assert.equal(canClaim(familyFromExtension(".syx"), "HARDWARE_VERIFIED").ok, false);
});

test("family support matrix keeps proprietary write gated", () => {
  const matrix = familySupportMatrix();
  assert.equal(matrix.length, 6);
  assert.ok(matrix.every((f) => f.write === false));
  assert.ok(matrix.find((f) => f.family === "korg").gate === "FORMAT_CONTRACT_REQUIRED");
});
