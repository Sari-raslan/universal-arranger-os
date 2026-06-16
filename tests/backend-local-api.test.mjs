import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  app,
  makePattern,
  toMidi,
} = require("../backend/server.js");

const repoRoot = process.cwd();
const uploadsDir = path.join(repoRoot, "backend", "uploads");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("local backend exposes status, library, upload, and project contracts", async () => {
  await withServer(async (baseUrl) => {
    const homeResponse = await fetch(baseUrl);
    const homeText = await homeResponse.text();
    assert.equal(homeResponse.status, 200);
    assert.equal(
      /keyboard manager|uaos/i.test(homeText),
      true,
      "backend root should serve a local UI or fallback shell"
    );

    const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
    assert.equal(health.ok, true);
    assert.equal(health.service, "uaos-local-backend");

    const status = await fetch(`${baseUrl}/api/status`).then((response) => response.json());
    assert.equal(status.ok, true);
    assert.equal(Array.isArray(status.discoveredServices), true);
    assert.ok(status.discoveredServices.some((service) => service.id === "backend"));

    const library = await fetch(`${baseUrl}/api/library`).then((response) => response.json());
    assert.equal(library.ok, true);
    assert.ok(library.count > 0);
    assert.ok(library.items.some((item) => item.id === "Korg/sar.SET"));

    const sarSet = await fetch(`${baseUrl}/api/library/${encodeURIComponent("Korg/sar.SET")}`).then((response) => response.json());
    assert.equal(sarSet.kind, "directory");
    assert.equal(sarSet.possibleBrand, "Korg");
    assert.equal(sarSet.deepParserNeeded, true);

    const midiBuffer = toMidi(makePattern({ tempo: 96, chord: "Cm", structure: ["INTRO"] }));
    const upload = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "roundtrip.mid",
        base64: midiBuffer.toString("base64"),
      }),
    }).then((response) => response.json());

    assert.equal(upload.ok, true);
    assert.equal(upload.analysis.parser, "midi");
    assert.equal(upload.analysis.midi.validHeader, true);

    const uploadedFile = path.join(repoRoot, upload.stored.replaceAll("/", path.sep));
    if (uploadedFile.startsWith(uploadsDir) && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }

    const projectSave = await fetch(`${baseUrl}/api/project/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `test-project-${Date.now()}`,
        name: "Test Project",
        timeline: [{ id: "intro", type: "section", time: 0 }],
      }),
    }).then((response) => response.json());

    assert.equal(projectSave.ok, true);
    assert.equal(projectSave.project.name, "Test Project");

    const projectId = projectSave.project.id;
    const projectRead = await fetch(`${baseUrl}/api/project/${encodeURIComponent(projectId)}`).then((response) => response.json());
    assert.equal(projectRead.ok, true);
    assert.equal(projectRead.project.id, projectId);

    const projectDuplicate = await fetch(`${baseUrl}/api/project/${encodeURIComponent(projectId)}/duplicate`, {
      method: "POST",
    }).then((response) => response.json());
    assert.equal(projectDuplicate.ok, true);
    assert.ok(projectDuplicate.project.id !== projectId);

    const duplicateDelete = await fetch(`${baseUrl}/api/project/${encodeURIComponent(projectDuplicate.project.id)}?confirmed=true`, {
      method: "DELETE",
    }).then((response) => response.json());
    assert.equal(duplicateDelete.ok, true);

    const projectDelete = await fetch(`${baseUrl}/api/project/${encodeURIComponent(projectId)}?confirmed=true`, {
      method: "DELETE",
    }).then((response) => response.json());
    assert.equal(projectDelete.ok, true);

    const protectedDelete = await fetch(`${baseUrl}/api/library/${encodeURIComponent("Korg/sar.SET")}`, {
      method: "DELETE",
    }).then((response) => response.json());
    assert.equal(protectedDelete.ok, false);
    assert.equal(protectedDelete.error.includes("Protected"), true);
  });
});
