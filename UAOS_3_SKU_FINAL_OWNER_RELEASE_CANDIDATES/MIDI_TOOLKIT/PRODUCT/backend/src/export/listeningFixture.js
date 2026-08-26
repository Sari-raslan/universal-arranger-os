/**
 * Builds a short technical WAV mix for owner listening. Not musical-quality proof.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writePcm16MonoSine } from "../perception/melodyAnalysis.js";
import { createSharedExportSession } from "./wavExportAdapter.js";

export function writeListeningFixtureProject(rootDir) {
  fs.mkdirSync(rootDir, { recursive: true });
  const vocal = writePcm16MonoSine(440, 0.35);
  const arrangement = writePcm16MonoSine(330, 0.35);
  fs.writeFileSync(path.join(rootDir, "vocal.wav"), vocal);
  fs.writeFileSync(path.join(rootDir, "arrangement.wav"), arrangement);
  const project = {
    projectName: "owner-listening-fixture",
    sourceRecording: { relativePath: "vocal.wav" },
    arrangementRender: { relativePath: "arrangement.wav" }
  };
  const projectFile = path.join(rootDir, "project.json");
  fs.writeFileSync(projectFile, JSON.stringify(project, null, 2));
  return { project, projectFile, vocalBytes: vocal.length, arrangementBytes: arrangement.length };
}

export function exportListeningMix(options = {}) {
  const rootDir = options.rootDir || fs.mkdtempSync(path.join(os.tmpdir(), "uaos-listen-"));
  const { project, projectFile } = writeListeningFixtureProject(rootDir);
  const session = createSharedExportSession();
  const destinationPath = options.destinationPath || path.join(rootDir, "owner-listening-fixture-full-mix.wav");
  const result = session.exportWav({
    project,
    projectFile,
    mode: "FULL_MIX",
    destinationPath,
    overwrite: true
  });
  return { ...result, projectFile, rootDir, destinationPath };
}
