import { parseMidiMessage } from "../midi/midiMessageParser.js";

export const HARDWARE_SCHEMA_VERSION = 1;
export const MIDI_LEARN_STORAGE_KEY = "uaos_phase6_midi_learn_mappings";
export const HARDWARE_CONFIG_STORAGE_KEY = "uaos_phase6_hardware_config";

export const UAOS_COMMANDS = Object.freeze([
  "transport.start",
  "transport.stop",
  "panic",
  "intro.1",
  "intro.2",
  "intro.3",
  "variation.1",
  "variation.2",
  "variation.3",
  "variation.4",
  "fill.1",
  "fill.2",
  "fill.3",
  "fill.4",
  "break",
  "ending.1",
  "ending.2",
  "ending.3",
  "tempo.up",
  "tempo.down",
  "tempo.direct",
  "transpose",
  "sustain",
  "expression",
  "sampler.preset",
  "library.navigate",
  "part.mute",
  "part.solo",
  "mixer.volume",
  "mixer.pan",
  "arranger.part.assign",
  "ai.analyze.metadata",
  "record.start",
  "record.stop",
]);

export const PROFILE_STATUSES = Object.freeze({
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  EXPERIMENTAL: "experimental",
  MANUAL: "manual-verification-required",
});

export const SETUP_WIZARD_STEPS = Object.freeze([
  "capability-check",
  "permission-request",
  "device-discovery",
  "input-selection",
  "output-selection",
  "profile-selection",
  "channel-test",
  "note-test",
  "sustain-test",
  "transport-test",
  "arranger-button-test",
  "midi-learn",
  "sampler-routing-test",
  "save-configuration",
  "manual-validation-report",
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function now(clock) {
  return typeof clock === "function" ? clock() : Date.now();
}

function normalizeChannel(value, fallback = 1) {
  return clamp(Number(value || fallback), 1, 16);
}

function createMapping(message, command, options = {}) {
  return {
    id: `${command}:${message.type}:${message.channel ?? "system"}:${message.data1 ?? message.status}`,
    command,
    scope: options.scope || "profile",
    profileId: options.profileId || null,
    type: message.type,
    channel: message.channel,
    data1: message.data1 ?? null,
    data2: options.includeValue ? message.data2 ?? null : null,
    min: options.min ?? 0,
    max: options.max ?? 127,
    status: options.status || PROFILE_STATUSES.MANUAL,
  };
}

export const DEVICE_PROFILES = Object.freeze([
  {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: "korg-pa3x-oriental-foundation",
    manufacturer: "KORG",
    model: "PA3X Oriental",
    aliases: ["PA3X Oriental", "KORG PA3X OR"],
    inputChannel: 1,
    outputChannel: 1,
    drumChannel: 10,
    globalChannel: 1,
    splitPoint: { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: { start: { type: "system", status: 0xfa }, stop: { type: "system", status: 0xfc } },
    arrangerCommands: {
      "variation.1": { type: "cc", controller: 80, value: 1, status: PROFILE_STATUSES.EXPERIMENTAL },
      "variation.2": { type: "cc", controller: 81, value: 1, status: PROFILE_STATUSES.EXPERIMENTAL },
      "fill.1": { type: "cc", controller: 82, value: 1, status: PROFILE_STATUSES.EXPERIMENTAL },
      "break": { type: "cc", controller: 83, value: 1, status: PROFILE_STATUSES.EXPERIMENTAL },
    },
    controls: { sustain: 64, expression: 11, bankSelectMsb: 0, bankSelectLsb: 32, pitchBend: true, programChange: true },
    sysex: { capable: true, enabledByDefault: false, manufacturerId: [0x42], status: PROFILE_STATUSES.MANUAL },
    notes: "Foundation profile only. KORG proprietary style/protocol support is not claimed.",
    verificationStatus: PROFILE_STATUSES.MANUAL,
    version: 1,
  },
  {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: "korg-pa5x-foundation",
    manufacturer: "KORG",
    model: "PA5X",
    aliases: ["PA5X", "KORG PA5X"],
    inputChannel: 1,
    outputChannel: 1,
    drumChannel: 10,
    globalChannel: 1,
    splitPoint: { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: { start: { type: "system", status: 0xfa }, stop: { type: "system", status: 0xfc } },
    arrangerCommands: {},
    controls: { sustain: 64, expression: 11, bankSelectMsb: 0, bankSelectLsb: 32, pitchBend: true, programChange: true },
    sysex: { capable: true, enabledByDefault: false, manufacturerId: [0x42], status: PROFILE_STATUSES.MANUAL },
    notes: "Foundation profile. Manual verification required for panel-specific controls.",
    verificationStatus: PROFILE_STATUSES.MANUAL,
    version: 1,
  },
  {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: "yamaha-genos-foundation",
    manufacturer: "Yamaha",
    model: "Genos",
    aliases: ["Genos", "Yamaha Genos"],
    inputChannel: 1,
    outputChannel: 1,
    drumChannel: 10,
    globalChannel: 1,
    splitPoint: { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: { start: { type: "system", status: 0xfa }, stop: { type: "system", status: 0xfc } },
    arrangerCommands: {},
    controls: { sustain: 64, expression: 11, bankSelectMsb: 0, bankSelectLsb: 32, pitchBend: true, programChange: true },
    sysex: { capable: true, enabledByDefault: false, manufacturerId: [0x43], status: PROFILE_STATUSES.MANUAL },
    notes: "Foundation profile. Yamaha proprietary style/protocol support is not claimed.",
    verificationStatus: PROFILE_STATUSES.MANUAL,
    version: 1,
  },
  {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: "roland-bk9-foundation",
    manufacturer: "Roland",
    model: "BK-9",
    aliases: ["BK-9", "Roland BK9"],
    inputChannel: 1,
    outputChannel: 1,
    drumChannel: 10,
    globalChannel: 1,
    splitPoint: { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: { start: { type: "system", status: 0xfa }, stop: { type: "system", status: 0xfc } },
    arrangerCommands: {},
    controls: { sustain: 64, expression: 11, bankSelectMsb: 0, bankSelectLsb: 32, pitchBend: true, programChange: true },
    sysex: { capable: true, enabledByDefault: false, manufacturerId: [0x41], status: PROFILE_STATUSES.MANUAL },
    notes: "Foundation profile. Manual panel mapping verification required.",
    verificationStatus: PROFILE_STATUSES.MANUAL,
    version: 1,
  },
  {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: "ketron-sd9-foundation",
    manufacturer: "Ketron",
    model: "SD9",
    aliases: ["SD9", "Ketron SD9"],
    inputChannel: 1,
    outputChannel: 1,
    drumChannel: 10,
    globalChannel: 1,
    splitPoint: { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: { start: { type: "system", status: 0xfa }, stop: { type: "system", status: 0xfc } },
    arrangerCommands: {},
    controls: { sustain: 64, expression: 11, bankSelectMsb: 0, bankSelectLsb: 32, pitchBend: true, programChange: true },
    sysex: { capable: true, enabledByDefault: false, manufacturerId: [0x26], status: PROFILE_STATUSES.MANUAL },
    notes: "Foundation profile. Manual verification required before claiming support.",
    verificationStatus: PROFILE_STATUSES.MANUAL,
    version: 1,
  },
]);

export function validateDeviceProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object") errors.push("Profile must be an object.");
  if (!profile?.id) errors.push("Profile id is required.");
  if (!profile?.manufacturer) errors.push("Manufacturer is required.");
  if (!profile?.model) errors.push("Model is required.");
  if (!Array.isArray(profile?.aliases)) errors.push("Aliases must be an array.");
  if (profile?.inputChannel && (profile.inputChannel < 1 || profile.inputChannel > 16)) errors.push("Input channel must be 1-16.");
  if (profile?.outputChannel && (profile.outputChannel < 1 || profile.outputChannel > 16)) errors.push("Output channel must be 1-16.");
  if (!profile?.verificationStatus) errors.push("Verification status is required.");
  return { valid: errors.length === 0, errors };
}

export function migrateDeviceProfile(profile) {
  return {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    id: String(profile?.id || "unknown-profile"),
    manufacturer: String(profile?.manufacturer || "Unknown"),
    model: String(profile?.model || "Unknown"),
    aliases: Array.isArray(profile?.aliases) ? profile.aliases : [],
    inputChannel: normalizeChannel(profile?.inputChannel),
    outputChannel: normalizeChannel(profile?.outputChannel),
    drumChannel: normalizeChannel(profile?.drumChannel, 10),
    globalChannel: normalizeChannel(profile?.globalChannel),
    splitPoint: profile?.splitPoint || { note: 60, label: "C4", status: PROFILE_STATUSES.MANUAL },
    transport: profile?.transport || {},
    arrangerCommands: profile?.arrangerCommands || {},
    controls: profile?.controls || {},
    sysex: { capable: false, enabledByDefault: false, ...(profile?.sysex || {}) },
    notes: String(profile?.notes || ""),
    verificationStatus: profile?.verificationStatus || PROFILE_STATUSES.MANUAL,
    version: Number(profile?.version || 1),
  };
}

export function createMockMidiDevice(index = 1, direction = "input") {
  return {
    id: `mock-${direction}-${index}`,
    name: `UAOS Mock ${direction} ${index}`,
    manufacturer: "UAOS",
    model: `Mock ${direction.toUpperCase()} ${index}`,
    type: direction,
    state: "connected",
    connection: "open",
    capabilities: {
      input: direction === "input",
      output: direction === "output",
      sysex: false,
    },
    latencyMs: null,
    permissionState: "granted",
    reconnectState: "stable",
    electronBridgeState: "mock",
  };
}

export function createHardwareState(overrides = {}) {
  return {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    supported: true,
    permissionState: "unknown",
    unsupportedReason: null,
    electronBridgeState: "unknown",
    inputs: [],
    outputs: [],
    selectedInputId: null,
    selectedOutputId: null,
    selectedProfileId: DEVICE_PROFILES[0].id,
    channelConfig: { input: 1, output: 1, drum: 10, global: 1 },
    connectionState: "disconnected",
    reconnectState: "idle",
    latency: { estimateMs: null, samples: [] },
    diagnostic: createDiagnosticsState(),
    sysexConsent: createSysexConsent(),
    setupWizard: createSetupWizardState(),
    mappings: [],
    manualValidationStatus: "required",
    capabilities: { webMidi: false, electronBridge: false, mockMode: false },
    ...overrides,
  };
}

export async function discoverMidiDevices(environment = {}) {
  const win = environment.window;
  const nav = environment.navigator || win?.navigator;
  const useMock = Boolean(environment.mock);

  if (useMock) {
    return {
      supported: true,
      permissionState: "granted",
      electronBridgeState: "mock",
      inputs: [createMockMidiDevice(1, "input")],
      outputs: [createMockMidiDevice(1, "output")],
      events: [{ type: "mock-discovery", message: "Demo/mock mode; no physical device is claimed." }],
    };
  }

  if (win?.uaosMidi?.listDevices) {
    try {
      const result = await win.uaosMidi.listDevices();
      return {
        supported: Boolean(result.supported),
        permissionState: result.permissionState || "unknown",
        electronBridgeState: result.bridgeState || "available",
        inputs: result.inputs || [],
        outputs: result.outputs || [],
        events: result.events || [],
      };
    } catch (error) {
      return {
        supported: false,
        permissionState: "denied",
        electronBridgeState: "error",
        inputs: [],
        outputs: [],
        events: [{ type: "bridge-error", message: error.message }],
      };
    }
  }

  if (!nav?.requestMIDIAccess) {
    return {
      supported: false,
      permissionState: "unsupported",
      electronBridgeState: "absent",
      inputs: [],
      outputs: [],
      events: [{ type: "unsupported-browser", message: "Web MIDI is unavailable in this runtime." }],
    };
  }

  try {
    const access = await nav.requestMIDIAccess({ sysex: false });
    return {
      supported: true,
      permissionState: "granted",
      electronBridgeState: "browser",
      inputs: Array.from(access.inputs.values()).map(normalizeMidiPort),
      outputs: Array.from(access.outputs.values()).map(normalizeMidiPort),
      access,
      events: [{ type: "permission-granted", message: "Web MIDI permission granted." }],
    };
  } catch (error) {
    return {
      supported: true,
      permissionState: "denied",
      electronBridgeState: "browser",
      inputs: [],
      outputs: [],
      events: [{ type: "permission-error", message: error.message }],
    };
  }
}

export function normalizeMidiPort(port) {
  return {
    id: String(port.id || port.name || "unknown"),
    name: String(port.name || "MIDI Device"),
    manufacturer: String(port.manufacturer || "Unknown"),
    model: String(port.name || "Unknown"),
    type: port.type || "unknown",
    state: port.state || "unknown",
    connection: port.connection || "closed",
    capabilities: {
      input: port.type === "input",
      output: port.type === "output",
      sysex: false,
    },
    latencyMs: null,
    permissionState: "granted",
    reconnectState: port.state === "connected" ? "stable" : "disconnected",
    electronBridgeState: "browser",
  };
}

export function applyHotPlugEvent(state, event) {
  const key = event.port?.type === "output" ? "outputs" : "inputs";
  const normalized = normalizeMidiPort(event.port || {});
  const without = state[key].filter((device) => device.id !== normalized.id);
  return {
    ...state,
    [key]: normalized.state === "connected" ? [...without, normalized] : without,
    reconnectState: normalized.state === "connected" ? "reconnected" : "waiting",
    diagnostic: recordDiagnosticEvent(state.diagnostic, { type: "connection", message: `${normalized.name} ${normalized.state}` }),
  };
}

export function startMidiLearn(command, options = {}) {
  return {
    active: true,
    command,
    profileId: options.profileId || null,
    scope: options.scope || "profile",
    channelFilter: options.channelFilter ?? "all",
    startedAt: options.startedAt ?? 0,
    timeoutMs: options.timeoutMs ?? 15_000,
    status: "waiting",
  };
}

export function receiveMidiLearnControl(learnState, rawData, existingMappings = [], options = {}) {
  if (!learnState?.active) return { status: "idle", mapping: null, warning: null };
  const currentTime = options.now ?? 0;
  if (learnState.startedAt && currentTime - learnState.startedAt > learnState.timeoutMs) {
    return { status: "timeout", mapping: null, warning: "Learning timed out." };
  }
  const message = Array.isArray(rawData) || ArrayBuffer.isView(rawData) ? parseMidiMessage(rawData, currentTime) : rawData;
  if (learnState.channelFilter !== "all" && message.channel !== Number(learnState.channelFilter)) {
    return { status: "waiting", mapping: null, warning: "Channel filtered." };
  }
  const mapping = createMapping(message, learnState.command, learnState);
  const conflict = existingMappings.find((item) => item.command === mapping.command && item.id !== mapping.id);
  const duplicate = existingMappings.find((item) => item.type === mapping.type && item.channel === mapping.channel && item.data1 === mapping.data1 && item.command !== mapping.command);
  return {
    status: "learned",
    mapping,
    warning: conflict ? "replace-mapping" : duplicate ? "duplicate-control" : null,
  };
}

export function saveMidiMapping(existingMappings, mapping) {
  const withoutCommand = existingMappings.filter((item) => item.command !== mapping.command);
  return [...withoutCommand, mapping];
}

export function deleteMidiMapping(existingMappings, command) {
  return existingMappings.filter((item) => item.command !== command);
}

export function detectMappingConflict(existingMappings, candidate) {
  return existingMappings.find((item) => item.command !== candidate.command && item.type === candidate.type && item.channel === candidate.channel && item.data1 === candidate.data1) || null;
}

export function serializeMappings(mappings) {
  return JSON.stringify({ schemaVersion: HARDWARE_SCHEMA_VERSION, mappings }, null, 2);
}

export function importMappings(text) {
  const parsed = JSON.parse(text);
  const mappings = Array.isArray(parsed) ? parsed : parsed.mappings;
  if (!Array.isArray(mappings)) throw new Error("Mapping JSON must contain a mappings array.");
  return mappings.map((mapping) => ({
    id: String(mapping.id || `${mapping.command}:${mapping.type}`),
    command: String(mapping.command),
    scope: mapping.scope || "global",
    profileId: mapping.profileId || null,
    type: String(mapping.type),
    channel: mapping.channel == null ? null : Number(mapping.channel),
    data1: mapping.data1 == null ? null : Number(mapping.data1),
    data2: mapping.data2 == null ? null : Number(mapping.data2),
    min: Number(mapping.min ?? 0),
    max: Number(mapping.max ?? 127),
    status: mapping.status || PROFILE_STATUSES.MANUAL,
  }));
}

export function routeHardwareMessage(rawData, context = {}) {
  const message = Array.isArray(rawData) || ArrayBuffer.isView(rawData) ? parseMidiMessage(rawData, context.receivedAt || 0) : rawData;
  const mappings = context.mappings || [];
  const mapping = mappings.find((item) => (
    item.type === message.type &&
    (item.channel == null || item.channel === message.channel) &&
    (item.data1 == null || item.data1 === message.data1)
  ));
  const command = mapping?.command || defaultCommandForMessage(message);
  return buildUaosCommand(command, message, context);
}

function defaultCommandForMessage(message) {
  if (message.type === "start") return "transport.start";
  if (message.type === "stop") return "transport.stop";
  if (message.type === "controlChange" && message.controller === 64) return "sustain";
  if (message.type === "controlChange" && message.controller === 11) return "expression";
  if (message.type === "controlChange" && (message.controller === 120 || message.controller === 123)) return "panic";
  if (message.type === "pitchBend") return "pitchBend";
  if (message.type === "programChange") return "sampler.preset";
  if (message.type === "noteOn") return "sampler.noteOn";
  if (message.type === "noteOff") return "sampler.noteOff";
  return "unmapped";
}

function buildUaosCommand(command, message, context) {
  const base = {
    ok: command !== "unmapped",
    command,
    source: "midi-hardware",
    message,
    profileId: context.profileId || null,
    metadataOnly: command === "ai.analyze.metadata",
  };

  if (command.startsWith("variation.")) return { ...base, target: "arranger", action: "section", section: `VAR_${command.split(".")[1]}` };
  if (command.startsWith("intro.")) return { ...base, target: "arranger", action: "section", section: `INTRO_${command.split(".")[1]}` };
  if (command.startsWith("fill.")) return { ...base, target: "arranger", action: "section", section: `FILL_${command.split(".")[1]}` };
  if (command.startsWith("ending.")) return { ...base, target: "arranger", action: "section", section: `ENDING_${command.split(".")[1]}` };
  if (command === "transport.start") return { ...base, target: "arranger", action: "start" };
  if (command === "transport.stop") return { ...base, target: "arranger", action: "stop" };
  if (command === "panic") return { ...base, target: "global", action: "panic" };
  if (command === "sustain") return { ...base, target: "sampler", action: "sustain", enabled: message.value >= 64 };
  if (command === "expression") return { ...base, target: "mixer", action: "expression", value: message.value };
  if (command === "pitchBend") return { ...base, target: "sampler", action: "pitchBend", value: message.centeredValue };
  if (command === "sampler.noteOn") return { ...base, target: "sampler", action: "noteOn", note: message.note, velocity: message.velocity };
  if (command === "sampler.noteOff") return { ...base, target: "sampler", action: "noteOff", note: message.note, velocity: message.velocity };
  if (command === "sampler.preset") return { ...base, target: "sampler", action: "preset", program: message.program };
  if (command === "tempo.direct") return { ...base, target: "arranger", action: "tempo", bpm: clamp(message.value || message.data1 || 96, 30, 260) };
  return base;
}

export function applyHardwareCommand(command, integrations = {}) {
  if (!command.ok) return { ok: false, reason: "unmapped" };
  if (command.action === "panic") {
    integrations.arranger?.({ type: "panic" });
    integrations.sampler?.panic?.();
    integrations.output?.panic?.();
    return { ok: true, panic: true };
  }
  if (command.target === "arranger") return { ok: true, result: integrations.arranger?.({ type: command.action, section: command.section, bpm: command.bpm }) };
  if (command.target === "sampler" && command.action === "noteOn") return { ok: true, result: integrations.sampler?.noteOn?.(command.note, command.velocity) };
  if (command.target === "sampler" && command.action === "noteOff") return { ok: true, result: integrations.sampler?.noteOff?.(command.note) };
  return { ok: true, deferred: true };
}

export class MidiOutputEngine {
  constructor({ output = null, clock = Date.now, rateLimitPerSecond = 120, sysexEnabled = false } = {}) {
    this.output = output;
    this.clock = clock;
    this.rateLimitPerSecond = rateLimitPerSecond;
    this.sysexEnabled = sysexEnabled;
    this.queue = [];
    this.sentAt = [];
    this.disconnected = false;
  }

  setOutput(output) {
    this.output = output;
    this.disconnected = false;
  }

  validate(bytes) {
    if (!Array.isArray(bytes) || bytes.length === 0) return { ok: false, reason: "empty-message" };
    if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) return { ok: false, reason: "invalid-byte" };
    if ((bytes[0] === 0xf0 || bytes[0] === 0xf7) && !this.sysexEnabled) return { ok: false, reason: "sysex-disabled" };
    return { ok: true };
  }

  enqueue(bytes, timestamp = now(this.clock)) {
    const validation = this.validate(bytes);
    if (!validation.ok) return validation;
    if (!this.output || this.disconnected) return { ok: false, reason: "output-disconnected" };
    this.queue.push({ bytes, timestamp });
    return { ok: true, queued: this.queue.length };
  }

  flush(currentTime = now(this.clock)) {
    const windowStart = currentTime - 1000;
    this.sentAt = this.sentAt.filter((time) => time >= windowStart);
    const ready = [];
    const pending = [];
    for (const item of this.queue) {
      if (item.timestamp <= currentTime && this.sentAt.length < this.rateLimitPerSecond) {
        this.output.send(item.bytes, item.timestamp);
        this.sentAt.push(currentTime);
        ready.push(item);
      } else {
        pending.push(item);
      }
    }
    this.queue = pending;
    return { sent: ready.length, pending: pending.length, rateLimited: pending.length > 0 };
  }

  sendNoteOn(note, velocity = 100, channel = 1, timestamp) {
    return this.enqueue([0x90 + normalizeChannel(channel) - 1, clamp(note, 0, 127), clamp(velocity, 0, 127)], timestamp);
  }

  sendNoteOff(note, velocity = 0, channel = 1, timestamp) {
    return this.enqueue([0x80 + normalizeChannel(channel) - 1, clamp(note, 0, 127), clamp(velocity, 0, 127)], timestamp);
  }

  sendCc(controller, value, channel = 1, timestamp) {
    return this.enqueue([0xb0 + normalizeChannel(channel) - 1, clamp(controller, 0, 127), clamp(value, 0, 127)], timestamp);
  }

  sendProgramChange(program, channel = 1, timestamp) {
    return this.enqueue([0xc0 + normalizeChannel(channel) - 1, clamp(program, 0, 127)], timestamp);
  }

  sendBankSelect(msb = 0, lsb = 0, channel = 1, timestamp) {
    this.sendCc(0, msb, channel, timestamp);
    return this.sendCc(32, lsb, channel, timestamp);
  }

  sendPitchBend(value = 0, channel = 1, timestamp) {
    const normalized = clamp(value + 8192, 0, 16383);
    return this.enqueue([0xe0 + normalizeChannel(channel) - 1, normalized & 0x7f, (normalized >> 7) & 0x7f], timestamp);
  }

  sendClock(timestamp) { return this.enqueue([0xf8], timestamp); }
  start(timestamp) { return this.enqueue([0xfa], timestamp); }
  continue(timestamp) { return this.enqueue([0xfb], timestamp); }
  stop(timestamp) { return this.enqueue([0xfc], timestamp); }

  allNotesOff(channel = "all", timestamp) {
    const channels = channel === "all" ? Array.from({ length: 16 }, (_, index) => index + 1) : [normalizeChannel(channel)];
    channels.forEach((item) => this.sendCc(123, 0, item, timestamp));
    return { ok: true, messages: channels.length };
  }

  resetControllers(channel = "all", timestamp) {
    const channels = channel === "all" ? Array.from({ length: 16 }, (_, index) => index + 1) : [normalizeChannel(channel)];
    channels.forEach((item) => this.sendCc(121, 0, item, timestamp));
    return { ok: true, messages: channels.length };
  }

  panic(timestamp) {
    this.allNotesOff("all", timestamp);
    this.resetControllers("all", timestamp);
    return { ok: true, queued: this.queue.length };
  }

  disconnect() {
    this.disconnected = true;
    this.queue = [];
  }
}

export function createSysexConsent(overrides = {}) {
  return {
    enabled: false,
    userPermission: false,
    dryRun: true,
    whitelistProfileIds: [],
    whitelistManufacturerIds: [],
    maxBytes: 256,
    sendConfirmationRequired: true,
    destructiveCommandsBlocked: true,
    undocumentedPacketsBlocked: true,
    ...overrides,
  };
}

export function validateSysexMessage(bytes, consent, profile = null) {
  if (!Array.isArray(bytes) || bytes[0] !== 0xf0 || bytes[bytes.length - 1] !== 0xf7) return { ok: false, reason: "not-sysex" };
  if (!consent?.enabled || !consent.userPermission) return { ok: false, reason: "sysex-disabled-by-default" };
  if (bytes.length > consent.maxBytes) return { ok: false, reason: "sysex-too-large" };
  const manufacturerId = bytes[1];
  if (consent.whitelistManufacturerIds.length && !consent.whitelistManufacturerIds.includes(manufacturerId)) return { ok: false, reason: "manufacturer-not-whitelisted" };
  if (profile && consent.whitelistProfileIds.length && !consent.whitelistProfileIds.includes(profile.id)) return { ok: false, reason: "profile-not-whitelisted" };
  const blocked = bytes.slice(1, -1).some((byte) => byte === 0x7e || byte === 0x7f);
  if (blocked && consent.destructiveCommandsBlocked) return { ok: false, reason: "potential-destructive-command-blocked" };
  return { ok: true, dryRun: consent.dryRun, preview: bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(" ") };
}

export function createSysexSender({ outputEngine, consent, profile, clock = Date.now } = {}) {
  let cancelled = false;
  return {
    cancel() {
      cancelled = true;
      return { ok: true, cancelled: true };
    },
    send(bytes, options = {}) {
      if (cancelled) return { ok: false, reason: "cancelled" };
      const validation = validateSysexMessage(bytes, consent, profile);
      if (!validation.ok) return validation;
      if (options.timeoutMs && now(clock) - (options.startedAt || now(clock)) > options.timeoutMs) return { ok: false, reason: "timeout" };
      if (validation.dryRun) return { ok: true, dryRun: true, preview: validation.preview };
      return outputEngine.enqueue(bytes, options.timestamp);
    },
  };
}

export function createDiagnosticsState() {
  return {
    events: [],
    droppedMessages: 0,
    invalidMessages: 0,
    clock: { running: false, messages: 0 },
    latencyEstimateMs: null,
    privacyNotice: "MIDI diagnostics stay local unless exported by the user.",
  };
}

export function recordDiagnosticEvent(state, event) {
  const next = {
    ...state,
    events: [{ time: event.time || new Date(0).toISOString(), ...event }, ...state.events].slice(0, 120),
  };
  if (event.type === "invalid") next.invalidMessages += 1;
  if (event.type === "dropped") next.droppedMessages += 1;
  if (event.type === "clock") next.clock = { running: true, messages: next.clock.messages + 1 };
  return next;
}

export function exportDiagnosticReport(state, hardwareState = {}) {
  return {
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    selectedInputId: hardwareState.selectedInputId || null,
    selectedOutputId: hardwareState.selectedOutputId || null,
    selectedProfileId: hardwareState.selectedProfileId || null,
    counters: {
      droppedMessages: state.droppedMessages,
      invalidMessages: state.invalidMessages,
      clockMessages: state.clock.messages,
    },
    latencyEstimateMs: state.latencyEstimateMs,
    privacyNotice: state.privacyNotice,
    events: state.events,
  };
}

export function createSetupWizardState(overrides = {}) {
  return {
    currentStep: SETUP_WIZARD_STEPS[0],
    completed: [],
    demoMode: false,
    validation: {},
    saved: false,
    reportGenerated: false,
    ...overrides,
  };
}

export function advanceSetupWizard(state, result = {}) {
  const index = SETUP_WIZARD_STEPS.indexOf(state.currentStep);
  const nextStep = SETUP_WIZARD_STEPS[Math.min(index + 1, SETUP_WIZARD_STEPS.length - 1)];
  return {
    ...state,
    completed: Array.from(new Set([...state.completed, state.currentStep])),
    currentStep: nextStep,
    validation: { ...state.validation, [state.currentStep]: result },
    saved: state.saved || state.currentStep === "save-configuration",
    reportGenerated: state.reportGenerated || state.currentStep === "manual-validation-report",
  };
}

export function migrateHardwareSession(value) {
  const base = createHardwareState();
  const source = value && typeof value === "object" ? value : {};
  return {
    ...base,
    ...source,
    schemaVersion: HARDWARE_SCHEMA_VERSION,
    inputs: Array.isArray(source.inputs) ? source.inputs : [],
    outputs: Array.isArray(source.outputs) ? source.outputs : [],
    channelConfig: { ...base.channelConfig, ...(source.channelConfig || {}) },
    diagnostic: { ...base.diagnostic, ...(source.diagnostic || {}), events: Array.isArray(source.diagnostic?.events) ? source.diagnostic.events : [] },
    sysexConsent: { ...base.sysexConsent, ...(source.sysexConsent || {}), enabled: false },
    setupWizard: { ...base.setupWizard, ...(source.setupWizard || {}) },
    mappings: Array.isArray(source.mappings) ? source.mappings : [],
    capabilities: { ...base.capabilities, ...(source.capabilities || {}) },
  };
}

export function createManualValidationChecklist(profile) {
  const tests = [
    "USB/MIDI connection",
    "input notes",
    "output notes",
    "sustain",
    "pitch bend",
    "program change",
    "transport",
    "intro",
    "variations",
    "fills",
    "break",
    "ending",
    "tempo",
    "drum channel",
    "panic",
    "latency",
    "reconnect",
  ];
  return {
    profileId: profile.id,
    device: `${profile.manufacturer} ${profile.model}`,
    verificationStatus: "manual-validation-required",
    tests: tests.map((name) => ({ name, status: "not-run", requiresPhysicalDevice: true })),
    knownUnsupportedFunctions: ["Proprietary style file compatibility is not claimed.", "Destructive SysEx and firmware commands are blocked."],
  };
}
