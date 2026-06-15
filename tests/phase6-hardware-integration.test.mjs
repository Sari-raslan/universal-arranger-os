import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEVICE_PROFILES,
  MidiOutputEngine,
  advanceSetupWizard,
  applyHardwareCommand,
  applyHotPlugEvent,
  createDiagnosticsState,
  createHardwareState,
  createManualValidationChecklist,
  createMockMidiDevice,
  createSetupWizardState,
  createSysexConsent,
  createSysexSender,
  deleteMidiMapping,
  detectMappingConflict,
  discoverMidiDevices,
  importMappings,
  migrateDeviceProfile,
  receiveMidiLearnControl,
  recordDiagnosticEvent,
  routeHardwareMessage,
  saveMidiMapping,
  serializeMappings,
  startMidiLearn,
  validateDeviceProfile,
  validateSysexMessage,
} from "../uaos-live-clean/src/hardware/hardwarePhase6.js";
import { createDefaultSession, exportSession, importSession, migrateSession } from "../uaos-live-clean/src/session/sessionStore.js";

test("Phase 6 device discovery uses deterministic mocks and handles hot-plug connect/disconnect", async () => {
  const result = await discoverMidiDevices({ mock: true });
  assert.equal(result.supported, true);
  assert.equal(result.inputs[0].id, "mock-input-1");
  assert.equal(result.outputs[0].id, "mock-output-1");

  const connected = applyHotPlugEvent(createHardwareState(), { port: { id: "usb-1", name: "USB Keys", type: "input", state: "connected" } });
  assert.equal(connected.inputs.length, 1);
  const disconnected = applyHotPlugEvent(connected, { port: { id: "usb-1", name: "USB Keys", type: "input", state: "disconnected" } });
  assert.equal(disconnected.inputs.length, 0);
  assert.equal(disconnected.reconnectState, "waiting");
});

test("Phase 6 profile schema validates, migrates, and marks foundation profiles honestly", () => {
  assert.equal(DEVICE_PROFILES.length, 5);
  for (const profile of DEVICE_PROFILES) {
    assert.equal(validateDeviceProfile(profile).valid, true);
    assert.match(profile.verificationStatus, /manual|experimental|unverified|verified/);
  }
  const migrated = migrateDeviceProfile({ id: "x", manufacturer: "M", model: "N", inputChannel: 99 });
  assert.equal(migrated.inputChannel, 16);
  assert.equal(createManualValidationChecklist(DEVICE_PROFILES[0]).tests.every((item) => item.status === "not-run"), true);
});

test("Phase 6 MIDI Learn learns notes, CC, program changes and detects duplicate mapping conflicts", () => {
  const learn = startMidiLearn("transport.start", { profileId: DEVICE_PROFILES[0].id, startedAt: 1 });
  const first = receiveMidiLearnControl(learn, [0xb0, 21, 127], [], { now: 2 });
  assert.equal(first.status, "learned");
  assert.equal(first.mapping.type, "controlChange");

  const mappings = saveMidiMapping([], first.mapping);
  const duplicate = receiveMidiLearnControl(startMidiLearn("panic", { startedAt: 1 }), [0xb0, 21, 1], mappings, { now: 2 });
  assert.equal(duplicate.warning, "duplicate-control");
  assert.ok(detectMappingConflict(mappings, duplicate.mapping));
  assert.equal(deleteMidiMapping(mappings, "transport.start").length, 0);

  assert.equal(receiveMidiLearnControl(startMidiLearn("sampler.preset", { startedAt: 1 }), [0xc0, 10], [], { now: 2 }).mapping.type, "programChange");
  assert.equal(receiveMidiLearnControl(startMidiLearn("pitch", { startedAt: 1 }), [0xe0, 0, 64], [], { now: 2 }).mapping.type, "pitchBend");
  assert.equal(receiveMidiLearnControl(startMidiLearn("note", { startedAt: 1 }), [0x90, 60, 100], [], { now: 2 }).mapping.type, "noteOn");
});

test("Phase 6 mapping export/import validates mapping JSON", () => {
  const mapping = receiveMidiLearnControl(startMidiLearn("fill.1", { startedAt: 1 }), [0xb0, 22, 127], [], { now: 2 }).mapping;
  const text = serializeMappings([mapping]);
  assert.equal(importMappings(text)[0].command, "fill.1");
  assert.throws(() => importMappings("{}"), /mappings array/);
});

test("Phase 6 hardware router emits UAOS arranger, sampler, sustain, pitch bend, program and panic commands", () => {
  assert.equal(routeHardwareMessage([0xfa]).action, "start");
  assert.equal(routeHardwareMessage([0xfc]).action, "stop");
  assert.equal(routeHardwareMessage([0x90, 60, 100]).action, "noteOn");
  assert.equal(routeHardwareMessage([0x80, 60, 0]).action, "noteOff");
  assert.equal(routeHardwareMessage([0xb0, 64, 127]).enabled, true);
  assert.equal(routeHardwareMessage([0xe0, 0, 64]).action, "pitchBend");
  assert.equal(routeHardwareMessage([0xc0, 4]).program, 4);
  assert.equal(routeHardwareMessage([0xb0, 123, 0]).action, "panic");

  const mapped = routeHardwareMessage([0xb0, 80, 127], { mappings: [{ type: "controlChange", channel: 0, data1: 80, command: "variation.1" }] });
  assert.equal(mapped.section, "VAR_1");
});

test("Phase 6 integrations call arranger, sampler and output panic contracts safely", () => {
  const calls = [];
  const result = applyHardwareCommand(routeHardwareMessage([0xb0, 123, 0]), {
    arranger: (action) => calls.push(action.type),
    sampler: { panic: () => calls.push("sampler-panic") },
    output: { panic: () => calls.push("output-panic") },
  });
  assert.equal(result.panic, true);
  assert.deepEqual(calls, ["panic", "sampler-panic", "output-panic"]);
});

test("Phase 6 MIDI output engine queues valid messages, protects invalid messages and handles disconnects", () => {
  const sent = [];
  const engine = new MidiOutputEngine({ output: { send: (bytes) => sent.push(bytes) }, clock: () => 1000, rateLimitPerSecond: 2 });
  assert.equal(engine.sendNoteOn(60, 100, 1, 1000).ok, true);
  assert.equal(engine.sendNoteOff(60, 0, 1, 1000).ok, true);
  assert.equal(engine.sendCc(7, 100, 1, 1000).ok, true);
  assert.equal(engine.sendProgramChange(10, 1, 1000).ok, true);
  assert.equal(engine.sendBankSelect(1, 2, 1, 1000).ok, true);
  assert.equal(engine.sendPitchBend(0, 1, 1000).ok, true);
  assert.equal(engine.sendClock(1000).ok, true);
  assert.equal(engine.start(1000).ok, true);
  assert.equal(engine.continue(1000).ok, true);
  assert.equal(engine.stop(1000).ok, true);
  assert.equal(engine.enqueue([300]).ok, false);
  assert.equal(engine.enqueue([0xf0, 0x7d, 0xf7]).reason, "sysex-disabled");
  assert.equal(engine.flush(1000).sent, 2);
  assert.equal(sent.length, 2);
  engine.disconnect();
  assert.equal(engine.sendNoteOn(61).reason, "output-disconnected");
});

test("Phase 6 SysEx safety is disabled by default and supports whitelist dry-run only", () => {
  const profile = DEVICE_PROFILES[0];
  const disabled = createSysexConsent();
  assert.equal(validateSysexMessage([0xf0, 0x42, 0x01, 0xf7], disabled, profile).reason, "sysex-disabled-by-default");
  const allowed = createSysexConsent({ enabled: true, userPermission: true, whitelistManufacturerIds: [0x42], whitelistProfileIds: [profile.id] });
  const result = validateSysexMessage([0xf0, 0x42, 0x01, 0xf7], allowed, profile);
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(createSysexSender({ consent: allowed, profile }).send([0xf0, 0x42, 0x01, 0xf7]).dryRun, true);
  assert.equal(createSysexSender({ consent: allowed, profile }).cancel().cancelled, true);
});

test("Phase 6 diagnostics counters, setup wizard states and session migration persist safely", () => {
  let diagnostics = createDiagnosticsState();
  diagnostics = recordDiagnosticEvent(diagnostics, { type: "invalid", message: "bad" });
  diagnostics = recordDiagnosticEvent(diagnostics, { type: "dropped", message: "drop" });
  diagnostics = recordDiagnosticEvent(diagnostics, { type: "clock", message: "tick" });
  assert.equal(diagnostics.invalidMessages, 1);
  assert.equal(diagnostics.droppedMessages, 1);
  assert.equal(diagnostics.clock.messages, 1);

  const wizard = advanceSetupWizard(createSetupWizardState(), { ok: true });
  assert.equal(wizard.completed.includes("capability-check"), true);

  const migrated = migrateSession({ version: 3, hardware: { selectedInputId: "gone", sysexConsent: { enabled: true } } });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.cloud.schemaVersion, 1);
  assert.equal(migrated.beta.schemaVersion, 1);
  assert.equal(migrated.hardware.selectedInputId, "gone");
  assert.equal(migrated.hardware.sysexConsent.enabled, false);
  assert.equal(importSession(exportSession(createDefaultSession())).hardware.schemaVersion, 1);
  assert.equal(importSession(exportSession(createDefaultSession())).dawProject.schemaVersion, 1);
});

test("Phase 6 UI and Electron bridge source expose required panels and safety labels", () => {
  const root = process.cwd();
  const panel = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "components", "HardwareIntegrationPanel.jsx"), "utf8");
  for (const text of [
    "Hardware Integration",
    "Scan MIDI",
    "Demo Mock",
    "MIDI Learn",
    "SysEx Safety",
    "Setup Wizard",
    "Diagnostics",
    "Manual Validation",
    "Panic",
    "does not claim a physical connection",
  ]) {
    assert.equal(panel.includes(text), true);
  }

  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  assert.equal(app.includes('id: "hardware"'), true);
  const electronMain = fs.readFileSync(path.join(root, "electron", "main.js"), "utf8");
  assert.equal(electronMain.includes("uaos:midi:list-devices"), true);
  assert.equal(electronMain.includes("preload.cjs"), true);
  assert.equal(fs.existsSync(path.join(root, "electron", "preload.cjs")), true);
});

test("Phase 6 device metadata exposes identity, capabilities and reconnect state", () => {
  const input = createMockMidiDevice(2, "input");
  assert.equal(input.manufacturer, "UAOS");
  assert.equal(input.capabilities.input, true);
  assert.equal(input.capabilities.output, false);
  assert.equal(input.reconnectState, "stable");
});
