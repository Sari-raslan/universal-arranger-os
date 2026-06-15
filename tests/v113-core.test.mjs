import test from "node:test";
import assert from "node:assert/strict";

import {
  canReceiveUpdate,
  normalizeReleaseChannel,
  selectReleaseCandidate,
} from "../src/v113/release-channel.js";
import {
  createUpdatePolicy,
  shouldInstallUpdate,
} from "../src/v113/update-policy.js";
import {
  getHardwareProfile,
  listHardwareProfiles,
  validateHardwareProfile,
} from "../src/v113/hardware-profiles.js";
import {
  compareMidiSequences,
  normalizeMidiEvent,
} from "../src/v113/midi-regression.js";
import { analyzeAudioFrame } from "../src/v113/audio-diagnostics.js";
import {
  createCrashRecord,
  sanitizeCrashValue,
} from "../src/v113/crash-log.js";

test("release channels are normalized and filtered", () => {
  assert.equal(normalizeReleaseChannel(" BETA "), "beta");
  assert.equal(canReceiveUpdate("stable", "beta"), false);
  assert.equal(canReceiveUpdate("beta", "stable"), true);

  const selected = selectReleaseCandidate("beta", [
    { version: "11.3.0-beta.1", channel: "beta" },
    { version: "11.2.0", channel: "stable" },
    { version: "11.4.0-nightly.1", channel: "nightly" },
  ]);

  assert.equal(selected.version, "11.3.0-beta.1");
});

test("update policy blocks unsafe installs", () => {
  const policy = createUpdatePolicy({
    rollbackEnabled: true,
    minimumBatteryPercent: 30,
  });

  assert.deepEqual(
    shouldInstallUpdate(policy, {
      batteryPercent: 20,
      hasBackup: true,
    }),
    { allowed: false, reason: "battery-too-low" },
  );

  assert.deepEqual(
    shouldInstallUpdate(policy, {
      batteryPercent: 90,
      hasBackup: false,
    }),
    { allowed: false, reason: "rollback-backup-missing" },
  );

  assert.deepEqual(
    shouldInstallUpdate(policy, {
      batteryPercent: 90,
      hasBackup: true,
    }),
    { allowed: true, reason: "ready" },
  );
});

test("hardware profiles cover target arranger families", () => {
  const profiles = listHardwareProfiles();
  assert.equal(profiles.length, 5);
  assert.equal(getHardwareProfile("yamaha-genos").vendor, "Yamaha");
  assert.deepEqual(
    validateHardwareProfile({ vendor: "KORG", model: "PA5X", family: "arranger" }),
    { valid: true, missing: [] },
  );
});

test("MIDI regression comparison detects timing and data changes", () => {
  const expected = [
    { status: 0x90, data1: 60, data2: 100, timestamp: 10 },
    { status: 0x80, data1: 60, data2: 0, timestamp: 110 },
  ];

  assert.equal(normalizeMidiEvent(expected[0]).data1, 60);
  assert.equal(compareMidiSequences(expected, expected).pass, true);

  const changed = structuredClone(expected);
  changed[1].timestamp = 120;
  assert.equal(compareMidiSequences(expected, changed, 3).reason, "timing-mismatch");
});

test("audio diagnostics report silence and clipping", () => {
  const silence = analyzeAudioFrame(new Float32Array([0, 0, 0]));
  assert.equal(silence.silent, true);
  assert.equal(silence.clipped, false);

  const clipped = analyzeAudioFrame(new Float32Array([0, 1, -1]));
  assert.equal(clipped.clipped, true);
  assert.equal(clipped.sampleCount, 3);
});

test("crash records redact sensitive values", () => {
  const sanitized = sanitizeCrashValue({
    token: "abc",
    nested: {
      authorization: "Bearer very-secret-token",
      file: "C:\\Users\\someone\\Documents\\UAOS",
    },
  });

  assert.equal(sanitized.token, "[redacted]");
  assert.equal(sanitized.nested.authorization, "[redacted]");
  assert.match(sanitized.nested.file, /^\[user-home\]/);

  const record = createCrashRecord(new Error("boom"), { password: "secret" });
  assert.equal(record.context.password, "[redacted]");
  assert.equal(record.name, "Error");
});