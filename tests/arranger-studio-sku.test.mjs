import test from "node:test";
import assert from "node:assert/strict";
import {
  createNewProject,
  openDemoProject,
  runAllCustomerWorkflows,
  runCleanInstallEquivalent,
  getProductStatus,
  getCompatibilityMatrix,
  getDemoCatalog
} from "../backend/src/sku/arrangerStudioSku.js";
import { getMidiToolkitStatus, runMidiToolkitMode } from "../backend/src/sku/midiToolkitSku.js";
import { getSingyLauncher, runSingyMode } from "../backend/src/sku/singySku.js";

test("Arranger SKU: 3 demo projects", () => {
  assert.equal(getDemoCatalog().length, 3);
  for (const id of ["demo-01-chords-arrangement", "demo-02-melody-arrangement", "demo-03-export-reopen"]) {
    const r = openDemoProject(id);
    assert.equal(r.ok, true, id);
    assert.ok(r.sha256);
  }
});

test("Arranger SKU: 20 customer workflows PASS", () => {
  const wf = runAllCustomerWorkflows();
  assert.equal(wf.total, 20);
  assert.equal(wf.pass, 20);
  assert.equal(wf.p0, 0);
  assert.equal(wf.p1, 0);
});

test("Arranger SKU: clean install equivalent PASS", () => {
  const clean = runCleanInstallEquivalent();
  assert.equal(clean.ok, true);
  assert.equal(clean.CLEAN_INSTALL_PASS, true);
  assert.equal(clean.SELF_CONTAINED_CORE_PASS, true);
});

test("Arranger SKU: compatibility matrix honest gates", () => {
  const m = getCompatibilityMatrix();
  assert.ok(m.some((r) => r.status === "FORMAT_CONTRACT_REQUIRED"));
  assert.ok(m.some((r) => r.status === "READ_ONLY_DEPENDENCY"));
});

test("Arranger SKU: product status ready for owner decision", () => {
  const s = getProductStatus();
  assert.equal(s.workflows.pass, 20);
  assert.equal(s.readyForOwnerReleaseDecision, true);
  assert.equal(s.musicalAcceptanceDeferred, true);
});

test("MIDI Toolkit SKU: all modes runnable", () => {
  const status = getMidiToolkitStatus();
  assert.equal(status.modes.length, 5);
  for (const mode of status.modes) {
    const r = runMidiToolkitMode(mode);
    assert.notEqual(r.ok, false, mode);
  }
});

test("Singy SKU: kids and teen modes", () => {
  const launcher = getSingyLauncher();
  assert.deepEqual(launcher.modes, ["KIDS", "TEEN"]);
  assert.equal(runSingyMode("KIDS").ok, true);
  assert.equal(runSingyMode("TEEN").ok, true);
});
