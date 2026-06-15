import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (...parts) => fs.readFileSync(
  path.join(process.cwd(), ...parts),
  "utf8",
);

const appSource = read("uaos-live-clean", "src", "App.jsx");
const librarySource = read(
  "uaos-live-clean",
  "src",
  "components",
  "LibraryBrowser.jsx",
);
const samplerSource = read(
  "uaos-live-clean",
  "src",
  "components",
  "SamplerWorkbench.jsx",
);
const engineSource = read(
  "uaos-live-clean",
  "src",
  "sampler",
  "sampleVoiceEngine.js",
);
const presetSource = read(
  "uaos-live-clean",
  "src",
  "sampler",
  "instrumentPreset.js",
);

test("App integrates Library Browser and Sampler Workbench", () => {
  assert.equal(appSource.includes("<LibraryBrowser />"), true);
  assert.equal(appSource.includes("<SamplerWorkbench />"), true);
});

test("Library Browser remains a real exported component", () => {
  assert.equal(
    /export function LibraryBrowser|export const LibraryBrowser/.test(
      librarySource,
    ),
    true,
  );
});

test("Sampler uses the current sample-zone and MIDI architecture", () => {
  assert.equal(samplerSource.includes("selectSampleZone"), true);
  assert.equal(samplerSource.includes("SampleVoiceEngine"), true);
  assert.equal(samplerSource.includes("useWebMidiInput"), true);
  assert.equal(samplerSource.includes("Import WAV files"), true);
  assert.equal(samplerSource.includes("Export preset"), true);
  assert.equal(samplerSource.includes("Panic / All Notes Off"), true);
});

test("Sampler safety text keeps SysEx disabled", () => {
  assert.equal(
    samplerSource.includes("SysEx") &&
      samplerSource.includes("disabled"),
    true,
  );
});

test("Sampler voice engine uses decoded audio buffers, not oscillator fallback", () => {
  assert.equal(engineSource.includes("createBufferSource"), true);
  assert.equal(engineSource.includes("AudioBuffer"), true);
  assert.equal(samplerSource.includes("createOscillator"), false);
});

test("Instrument presets expose current mapping helpers", () => {
  assert.equal(presetSource.includes("selectSampleZone"), true);
  assert.equal(presetSource.includes("createInstrumentPreset"), true);
  assert.equal(presetSource.includes("parseInstrumentPreset"), true);
});

test("Frontend sampler source remains deterministic", () => {
  assert.equal(samplerSource.includes("Math.random"), false);
});