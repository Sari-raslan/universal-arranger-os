import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSharedExportSession, loadWavExportFoundation } from "../backend/src/export/wavExportAdapter.js";
import { writeListeningFixtureProject } from "../backend/src/export/listeningFixture.js";
import { writePcm16MonoSine } from "../backend/src/perception/melodyAnalysis.js";

function silentWav() {
  const frames = 4410;
  const dataSize = frames * 2;
  const b = Buffer.alloc(44 + dataSize);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataSize, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(44100, 24);
  b.writeUInt32LE(44100 * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataSize, 40);
  return b;
}

test("WAV export foundation is WAV-only and refuses MP3", () => {
  const mod = loadWavExportFoundation();
  const mp3 = mod.mp3Availability();
  assert.equal(mp3.available, false);
  assert.equal(mp3.formatsAvailable.includes("wav"), true);
  assert.equal(mp3.formatsAvailable.includes("mp3"), false);
});

test("FULL_MIX exports a non-silent WAV with musicalQualityPass false", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "uaos-wav-"));
  const { project, projectFile } = writeListeningFixtureProject(root);
  const session = createSharedExportSession();
  const dest = path.join(root, "mix.wav");
  const result = session.exportWav({
    project,
    projectFile,
    mode: "FULL_MIX",
    destinationPath: dest,
    overwrite: true
  });
  assert.equal(result.ok, true, result.errorCode || result.reason);
  assert.equal(result.format, "wav");
  assert.equal(result.analysis.musicalQualityPass, false);
  assert.equal(result.analysis.masteringClaim, false);
  assert.equal(result.mp3.available, false);
  assert.equal(fs.existsSync(dest), true);
  assert.ok(fs.statSync(dest).size > 44);
});

test("VOCAL_ONLY and ARRANGEMENT_ONLY copy managed sources", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "uaos-wav-"));
  const { project, projectFile } = writeListeningFixtureProject(root);
  const session = createSharedExportSession();
  const vocal = session.exportWav({
    project,
    projectFile,
    mode: "VOCAL_ONLY",
    destinationPath: path.join(root, "vocal-out.wav"),
    overwrite: true
  });
  const arrangement = session.exportWav({
    project,
    projectFile,
    mode: "ARRANGEMENT_ONLY",
    destinationPath: path.join(root, "arr-out.wav"),
    overwrite: true
  });
  assert.equal(vocal.ok, true, vocal.errorCode);
  assert.equal(arrangement.ok, true, arrangement.errorCode);
  assert.equal(vocal.analysis.musicalQualityPass, false);
  assert.equal(arrangement.analysis.musicalQualityPass, false);
});

test("silent source is refused", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "uaos-wav-silent-"));
  fs.writeFileSync(path.join(root, "silent.wav"), silentWav());
  const project = { projectName: "silent", masterAudio: { relativePath: "silent.wav" } };
  const projectFile = path.join(root, "project.json");
  fs.writeFileSync(projectFile, JSON.stringify(project));
  const session = createSharedExportSession();
  const result = session.exportWav({
    project,
    projectFile,
    mode: "FULL_MIX",
    destinationPath: path.join(root, "out.wav"),
    overwrite: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "SILENT_OR_EMPTY_AUDIO");
});

test("missing vocal fails closed", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "uaos-wav-missing-"));
  const project = { projectName: "missing", sourceRecording: { relativePath: "nope.wav" } };
  const projectFile = path.join(root, "project.json");
  fs.writeFileSync(projectFile, JSON.stringify(project));
  writePcm16MonoSine(440, 0.1);
  const session = createSharedExportSession();
  const result = session.exportWav({
    project,
    projectFile,
    mode: "VOCAL_ONLY",
    destinationPath: path.join(root, "out.wav"),
    overwrite: true
  });
  assert.equal(result.ok, false);
});
