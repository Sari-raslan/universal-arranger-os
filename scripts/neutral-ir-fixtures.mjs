#!/usr/bin/env node
/**
 * Generate lawful UAOS-owned fixtures for Neutral IR inspect tests.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeMidiSmf } from "../backend/src/convert/uaosNeutralIr.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(ROOT, "samples", "fixtures");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

ensureDir(path.join(FIX, "midi"));
ensureDir(path.join(FIX, "korg"));
ensureDir(path.join(FIX, "yamaha"));
ensureDir(path.join(FIX, "sysex"));

const midi = encodeMidiSmf({
  noteEvents: [
    { midi: 36, startTick: 0, durationTicks: 240, velocity: 100, channel: 9 },
    { midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 },
    { midi: 64, startTick: 480, durationTicks: 480, velocity: 85, channel: 0 }
  ],
  ppq: 480
});
fs.writeFileSync(path.join(FIX, "midi", "reference-demo.mid"), midi);

const syntheticKorg = Buffer.concat([
  Buffer.from("KORG SYNTHETIC INSPECT FIXTURE UAOS_GENERATED\n", "ascii"),
  Buffer.alloc(256, 0x00)
]);
fs.writeFileSync(path.join(FIX, "korg", "synthetic-inspect.set"), syntheticKorg);

const syntheticYamaha = Buffer.concat([
  Buffer.from("YAMAHA STY SYNTHETIC UAOS_GENERATED\n", "ascii"),
  Buffer.alloc(128, 0x00)
]);
fs.writeFileSync(path.join(FIX, "yamaha", "synthetic-inspect.sty"), syntheticYamaha);

const sysex = Buffer.from([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);
fs.writeFileSync(path.join(FIX, "sysex", "identity-request.syx"), sysex);

console.log("neutral-ir-fixtures: generated", FIX);
