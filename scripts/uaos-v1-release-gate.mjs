import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const requiredCodeFiles = [
  "uaos-live-clean/src/App.jsx",
  "uaos-live-clean/src/components/LibraryBrowser.jsx",
  "uaos-live-clean/src/components/SamplerWorkbench.jsx",
  "uaos-live-clean/src/components/ArrangerEnginePanel.jsx",
  "uaos-live-clean/src/midi/midiMessageParser.js",
  "uaos-live-clean/src/arranger/chordRecognizer.js",
  "uaos-live-clean/src/arranger/openStyleEngine.js",
];

const legalDrafts = [
  "docs/legal/IMPRESSUM_DRAFT.md",
  "docs/legal/PRIVACY_DRAFT.md",
  "docs/legal/TERMS_DRAFT.md",
  "docs/legal/CANCELLATION_DRAFT.md",
];

const codeChecks = requiredCodeFiles.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const legalDraftChecks = legalDrafts.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const commercialChecks = [
  {
    name: "UAOS_PUBLIC_BASE_URL",
    passed: Boolean(process.env.UAOS_PUBLIC_BASE_URL),
  },
  {
    name: "UAOS_PAYMENT_PROVIDER",
    passed: Boolean(process.env.UAOS_PAYMENT_PROVIDER),
  },
  {
    name: "UAOS_PAYMENT_SECRET",
    passed: Boolean(process.env.UAOS_PAYMENT_SECRET),
  },
  {
    name: "UAOS_LICENSE_SIGNING_SECRET",
    passed: Boolean(process.env.UAOS_LICENSE_SIGNING_SECRET),
  },
  {
    name: "UAOS_SUPPORT_EMAIL",
    passed: Boolean(process.env.UAOS_SUPPORT_EMAIL),
  },
  {
    name: "UAOS_OFFICIAL_LEGAL_APPROVAL=true",
    passed: process.env.UAOS_OFFICIAL_LEGAL_APPROVAL === "true",
  },
  {
    name: "UAOS_HARDWARE_VALIDATION_APPROVED=true",
    passed: process.env.UAOS_HARDWARE_VALIDATION_APPROVED === "true",
  },
  {
    name: "UAOS_WINDOWS_SIGNING_READY=true",
    passed: process.env.UAOS_WINDOWS_SIGNING_READY === "true",
  },
];

const publicBetaCodeReady = codeChecks.every((check) => check.passed);
const legalDraftsPresent = legalDraftChecks.every((check) => check.passed);
const commercialReady =
  publicBetaCodeReady &&
  legalDraftsPresent &&
  commercialChecks.every((check) => check.passed);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  publicBetaCodeReady,
  legalDraftsPresent,
  commercialReady,
  codeChecks,
  legalDraftChecks,
  commercialChecks,
  notes: [
    "Draft legal documents are not official approval.",
    "Payment secrets must remain server-side.",
    "Hardware approval must follow physical device tests.",
    "Commercial release must use a signed Windows installer.",
  ],
};

fs.writeFileSync(
  path.join(reportsDir, "UAOS_V1_RELEASE_GATE.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const lineFor = (check) => `- ${check.passed ? "[x]" : "[ ]"} ${check.name}`;

const markdown = [
  "# UAOS V1 Release Gate",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `Public Beta code ready: ${publicBetaCodeReady}`,
  `Legal drafts present: ${legalDraftsPresent}`,
  `Commercial launch ready: ${commercialReady}`,
  "",
  "## Code",
  "",
  ...codeChecks.map(lineFor),
  "",
  "## Legal drafts",
  "",
  ...legalDraftChecks.map(lineFor),
  "",
  "## Commercial and external requirements",
  "",
  ...commercialChecks.map(lineFor),
  "",
  "Draft documents and readiness scripts do not replace professional review,",
  "physical hardware testing, payment-provider configuration, or code signing.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reportsDir, "UAOS_V1_RELEASE_GATE.md"),
  markdown,
  "utf8",
);

console.log(`Public Beta code ready: ${publicBetaCodeReady}`);
console.log(`Commercial launch ready: ${commercialReady}`);

const strictCommercial = process.argv.includes("--strict-commercial");

if (!publicBetaCodeReady) {
  process.exit(1);
}

if (strictCommercial && !commercialReady) {
  process.exit(2);
}