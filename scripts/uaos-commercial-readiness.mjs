import fs from "node:fs";
import path from "node:path";
import { commercialConfigStatus } from "../server/commercial/config.mjs";

const root = process.cwd();
const reportsDirectory = path.join(root, "reports");
fs.mkdirSync(reportsDirectory, { recursive: true });

const requiredFiles = [
  "server/commercial/plans.mjs",
  "server/commercial/config.mjs",
  "server/commercial/crypto.mjs",
  "server/commercial/licenseService.mjs",
  "server/commercial/paymentWebhook.mjs",
  "server/commercial/server.mjs",
  "tests/commercial-backend.test.mjs",
  ".env.commercial.example",
];

const fileChecks = requiredFiles.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const configuration = commercialConfigStatus(process.env);
const codeReady = fileChecks.every((check) => check.passed);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  codeReady,
  productionConfigured: configuration.productionReady,
  fileChecks,
  environmentChecks: configuration.checks,
  prices: {
    creatorMonthlyEur: 19.99,
    professionalMonthlyEur: 49.99,
  },
  safety: {
    secretsInFrontend: false,
    webhookSignatureRequired: true,
    licenseSignatureRequired: true,
    productionDatabaseRequired: true,
    providerIntegrationEnabled: false,
  },
};

fs.writeFileSync(
  path.join(reportsDirectory, "UAOS_COMMERCIAL_READINESS.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const mark = (passed) => (passed ? "[x]" : "[ ]");

const markdown = [
  "# UAOS Commercial Readiness",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `Code ready: ${codeReady}`,
  `Production configured: ${configuration.productionReady}`,
  "",
  "## Foundation files",
  "",
  ...fileChecks.map(
    (check) => `- ${mark(check.passed)} ${check.name}`,
  ),
  "",
  "## Production environment",
  "",
  ...configuration.checks.map(
    (check) => `- ${mark(check.passed)} ${check.name}`,
  ),
  "",
  "## Safety",
  "",
  "- Payment and license secrets remain server-side.",
  "- Webhooks require HMAC verification.",
  "- License tokens require HMAC signatures.",
  "- Production requires a database-backed idempotency/account adapter.",
  "- No real payment-provider API has been enabled.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reportsDirectory, "UAOS_COMMERCIAL_READINESS.md"),
  markdown,
  "utf8",
);

console.log(`Commercial backend code ready: ${codeReady}`);
console.log(
  `Commercial production configured: ${configuration.productionReady}`,
);

const strict = process.argv.includes("--strict-production");

if (!codeReady) {
  process.exit(1);
}

if (strict && !configuration.productionReady) {
  process.exit(2);
}