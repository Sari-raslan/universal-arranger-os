const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");

const { createSetScanner, classifySetResource, assertAllowedPath } = require("../backend/services/setScanner");
const { listDeviceProfiles, getDeviceProfile } = require("../backend/services/deviceProfiles");
const { createSmartSequencerService } = require("../backend/services/smartSequencer");

test("device profiles expose five conservative profiles", () => {
  const profiles = listDeviceProfiles();
  assert.equal(profiles.length, 5);
  for (const profile of profiles) {
    assert.ok(profile.id);
    assert.ok(profile.vendor);
    assert.ok(profile.model);
    assert.notEqual(profile.implementationStatus, "full");
  }
  assert.equal(getDeviceProfile("missing"), null);
});

test("resource classification is conservative", () => {
  assert.equal(classifySetResource(".sty"), "style_resource");
  assert.equal(classifySetResource(".mid"), "midi_resource");
  assert.equal(classifySetResource(".exe"), "unsupported");
});

test("scanner indexes a temporary SET tree without modifying files", async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "uaos-set-"));
  const setDir = path.join(root, "Demo.SET");
  const nested = path.join(setDir, "STYLE");
  await fsp.mkdir(nested, { recursive: true });
  const file = path.join(nested, "demo.sty");
  await fsp.writeFile(file, "uaos-demo", "utf8");
  const before = await fsp.readFile(file, "utf8");

  const scanner = createSetScanner({ allowedRoots: [root] });
  const result = await scanner.scan(root);

  assert.equal(result.implementationStatus, "partial_indexing_only");
  assert.ok(result.files.some((item) => item.classification === "korg_set_container"));
  assert.ok(result.files.some((item) => item.checksum && item.relativePath.endsWith("demo.sty")));

  const after = await fsp.readFile(file, "utf8");
  assert.equal(after, before);

  await assert.rejects(
    () => assertAllowedPath(path.resolve(root, ".."), [root]),
    (error) => error.code === "PATH_OUTSIDE_ALLOWED_ROOT"
  );

  await fsp.rm(root, { recursive: true, force: true });
});

test("smart sequencer returns deterministic metadata-only result", async () => {
  const service = createSmartSequencerService();
  const input = {
    title: "Demo",
    durationSeconds: 180,
    tempoHint: 96,
    timeSignatureHint: "4/4",
    deviceProfileId: "korg-pa5x"
  };

  const first = service.createJob(input);
  assert.equal(first.status, "queued");
  const completed = await service.processJob(first.jobId);
  assert.equal(completed.status, "completed");
  assert.equal(completed.result.detectedTempo, 96);
  assert.equal(completed.result.audioAnalysis.status, "unavailable");
  assert.equal(service.getJob("missing"), null);
});
