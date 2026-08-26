import test from "node:test";
import assert from "node:assert/strict";
import { createInspectionProject, verifyInspectionEnvelope } from "../backend/src/keyboard/inspectionProject.js";

test("Keyboard Pro inspection envelope hashes entries and refuses silent drift", () => {
  const created = createInspectionProject({
    name: "sar-set-inspect",
    files: [{ path: "sar.SET", bytes: Buffer.from("KORG SET PLACEHOLDER"), family: "korg", level: "INSPECT" }]
  });
  assert.equal(created.ok, true);
  assert.equal(created.project.write, "FORMAT_CONTRACT_REQUIRED");
  assert.equal(created.project.hardwareWrite, "HARDWARE_REQUIRED");
  assert.equal(verifyInspectionEnvelope(created.project).ok, true);
  const tampered = { ...created.project, name: "changed" };
  assert.equal(verifyInspectionEnvelope(tampered).ok, false);
});
