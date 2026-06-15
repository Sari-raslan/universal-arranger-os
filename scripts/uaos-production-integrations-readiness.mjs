import fs from "node:fs";
import path from "node:path";
import {
  productionIntegrationsStatus,
} from "../server/production/config.mjs";

const root = process.cwd();
const reports = path.join(root, "reports");
fs.mkdirSync(reports, { recursive: true });

const requiredFiles = [
  "server/production/config.mjs",
  "server/production/postgresAccountRepository.mjs",
  "server/production/postgresAccountService.mjs",
  "server/production/smtpEmailService.mjs",
  "server/production/accountsServer.mjs",
  "migrations/001_accounts.sql",
  "scripts/uaos-db-migrate.mjs",
  "tests/production-integrations.test.mjs",
  ".env.production.integrations.example",
];

const fileChecks = requiredFiles.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const environment = productionIntegrationsStatus(process.env);
const codeReady = fileChecks.every((check) => check.passed);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  codeReady,
  productionConfigured:
    codeReady && environment.productionConfigured,
  fileChecks,
  environmentChecks: environment.checks,
  databaseMigrationExecuted: false,
  smtpConnectionVerified: false,
  notes: [
    "The default readiness command does not connect to PostgreSQL.",
    "The default readiness command does not send email.",
    "Run strict readiness only with private production environment variables.",
  ],
};

fs.writeFileSync(
  path.join(reports, "UAOS_PRODUCTION_INTEGRATIONS_READINESS.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const mark = (passed) => (passed ? "[x]" : "[ ]");

fs.writeFileSync(
  path.join(reports, "UAOS_PRODUCTION_INTEGRATIONS_READINESS.md"),
  [
    "# UAOS Production Data and Email Readiness",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    `Code ready: ${codeReady}`,
    `Production configured: ${result.productionConfigured}`,
    "",
    "## Files",
    "",
    ...fileChecks.map(
      (check) => `- ${mark(check.passed)} ${check.name}`,
    ),
    "",
    "## Private production configuration",
    "",
    ...environment.checks.map(
      (check) => `- ${mark(check.passed)} ${check.name}`,
    ),
    "",
    "No database connection or email delivery was attempted.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Production integration code ready: ${codeReady}`);
console.log(
  `Production integration configured: ${result.productionConfigured}`,
);

const strict = process.argv.includes("--strict-production");

if (!codeReady) {
  process.exit(1);
}

if (strict && !result.productionConfigured) {
  process.exit(2);
}