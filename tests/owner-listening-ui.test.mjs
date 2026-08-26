import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  verifyCatalogHashes,
  applyOwnerDecision,
  readDecision,
  pendingDecision,
  createOwnerListeningServer
} from "../scripts/owner-listening-ui.mjs";

test("listening pack hashes still match and UI file exists", () => {
  const verify = verifyCatalogHashes();
  assert.equal(verify.ok, true);
  assert.equal(verify.wavCount, 6);
  assert.equal(verify.uniqueSha256, 5);
  assert.equal(verify.hashMatch, true);
  assert.equal(verify.musicalQualityPass, false);
  assert.equal(fs.existsSync("docs/owner-listening-pack/owner-listening.html"), true);
  const html = fs.readFileSync("docs/owner-listening-pack/owner-listening.html", "utf8");
  for (const token of ["Play", "Pause", "Previous", "Next", "NEEDS_FIXES", "PASS", "A/B"]) {
    assert.ok(html.includes(token), token);
  }
});

test("playback and missing confirmation cannot record PASS", () => {
  const decisionPath = path.join(os.tmpdir(), `uaos-owner-decision-${Date.now()}.json`);
  const playback = applyOwnerDecision({
    decision: "OWNER_MUSICAL_LISTENING_PASS",
    fromPlayback: true,
    explicitOwnerClick: true,
    confirmPass: true,
    confirmNoRelease: true
  }, decisionPath);
  assert.equal(playback.ok, false);
  const missing = applyOwnerDecision({
    decision: "OWNER_MUSICAL_LISTENING_PASS",
    explicitOwnerClick: true
  }, decisionPath);
  assert.equal(missing.ok, false);
  assert.equal(readDecision(decisionPath).decision, "PENDING");
});

test("explicit NEEDS_FIXES with notes writes local decision only", () => {
  const decisionPath = path.join(os.tmpdir(), `uaos-owner-decision-fix-${Date.now()}.json`);
  const result = applyOwnerDecision({
    decision: "OWNER_MUSICAL_LISTENING_NEEDS_FIXES",
    explicitOwnerClick: true,
    overallNotes: "bass too quiet",
    notesByExample: { "01-melody-example": "need clearer attack" },
    publicRelease: true
  }, decisionPath);
  assert.equal(result.ok, true);
  assert.equal(result.record.decision, "OWNER_MUSICAL_LISTENING_NEEDS_FIXES");
  assert.equal(result.record.publicRelease, false);
  assert.equal(result.record.productionDeploy, false);
  fs.unlinkSync(decisionPath);
});

test("local UI server serves HTML and rejects auto PASS", async () => {
  const decisionPath = path.join(os.tmpdir(), `uaos-owner-decision-http-${Date.now()}.json`);
  const { server } = createOwnerListeningServer({ port: 0, decisionPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const headers = { connection: "close", "content-type": "application/json" };
  try {
    const html = await fetch(base + "/", { headers: { connection: "close" } }).then((r) => r.text());
    assert.ok(html.includes("Owner Listening"));
    const wav = await fetch(base + "/musical-examples/01-melody-example.wav", { headers: { connection: "close" } });
    assert.equal(wav.status, 200);
    await wav.arrayBuffer();
    const played = await fetch(base + "/api/played", {
      method: "POST",
      headers,
      body: JSON.stringify({ id: "01-melody-example" })
    }).then((r) => r.json());
    assert.equal(played.recordedPass, false);
    const bad = await fetch(base + "/api/decision", {
      method: "POST",
      headers,
      body: JSON.stringify({ decision: "OWNER_MUSICAL_LISTENING_PASS", explicitOwnerClick: true })
    }).then((r) => r.json());
    assert.equal(bad.ok, false);
    const status = await fetch(base + "/api/status", { headers: { connection: "close" } }).then((r) => r.json());
    assert.equal(status.hashVerify.hashMatch, true);
    assert.equal(status.decision, "PENDING");
    assert.equal(status.autoPass, false);
  } finally {
    if (typeof server.closeAllConnections === "function") server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  assert.deepEqual(pendingDecision().decision, "PENDING");
});
