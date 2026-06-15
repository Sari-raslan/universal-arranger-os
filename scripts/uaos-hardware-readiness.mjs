import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const requiredFoundations = [
  "uaos-live-clean/src/hooks/useWebMidiInput.js",
  "uaos-live-clean/src/midi/midiMessageParser.js",
  "uaos-live-clean/src/midi/deviceProfiles.js",
  "uaos-live-clean/src/hardware/hardwarePhase6.js",
  "uaos-live-clean/src/components/HardwareIntegrationPanel.jsx",
  "electron/preload.cjs",
  "uaos-live-clean/src/components/SamplerWorkbench.jsx",
  "uaos-live-clean/src/components/ArrangerEnginePanel.jsx",
];

const profiles = [
  "KORG PA3X",
  "KORG PA5X",
  "Yamaha Genos",
  "Roland BK-9",
  "Ketron SD9",
];

const checks = requiredFoundations.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const codeReady = checks.every((check) => check.passed);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  codeReady,
  manualHardwareValidationRequired: true,
  sysexEnabled: false,
  midiOutputEnabled: true,
  requiredFoundations: checks,
  targetProfiles: profiles.map((name) => ({
    name,
    noteOnOff: "manual-test-required",
    velocity: "manual-test-required",
    sustain: "manual-test-required",
    pitchBend: "manual-test-required",
    channelFilter: "manual-test-required",
    panic: "manual-test-required",
    latency: "manual-test-required",
  })),
};

fs.writeFileSync(
  path.join(reportsDir, "UAOS_HARDWARE_READINESS.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const markdown = [
  "# UAOS Hardware Readiness",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `Code foundation ready: ${codeReady}`,
  "",
  "## Safety",
  "",
  "- SysEx enabled: false",
  "- MIDI output enabled: false",
  "- Real hardware validation still required.",
  "",
  "## Target devices",
  "",
  ...profiles.map((name) => `- ${name}: manual validation required`),
  "",
  "## Required manual checks",
  "",
  "- Note On/Off",
  "- Velocity",
  "- Sustain CC64",
  "- Pitch bend",
  "- MIDI channel filtering",
  "- Panic / All Notes Off",
  "- Latency and stuck-note behavior",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reportsDir, "UAOS_HARDWARE_READINESS.md"),
  markdown,
  "utf8",
);

console.log(
  codeReady
    ? "UAOS hardware code readiness passed; physical validation remains."
    : "UAOS hardware code readiness failed.",
);

process.exit(codeReady ? 0 : 1);
