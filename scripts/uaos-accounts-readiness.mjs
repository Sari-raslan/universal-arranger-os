import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reports = path.join(root, "reports");
fs.mkdirSync(reports, { recursive: true });

const files = [
  "server/accounts/passwords.mjs",
  "server/accounts/tokens.mjs",
  "server/accounts/stores.mjs",
  "server/accounts/accountService.mjs",
  "server/accounts/server.mjs",
  "tests/accounts-auth.test.mjs",
  ".env.accounts.example",
];

const fileChecks = files.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(path.join(root, relativePath)),
}));

const environmentChecks = [
  {
    name: "production-database-adapter",
    passed:
      process.env.UAOS_ACCOUNTS_STORAGE === "database",
  },
  {
    name: "production-email-provider",
    passed: Boolean(process.env.UAOS_EMAIL_PROVIDER),
  },
  {
    name: "email-from-address",
    passed: Boolean(process.env.UAOS_EMAIL_FROM),
  },
  {
    name: "public-base-url",
    passed: Boolean(process.env.UAOS_PUBLIC_BASE_URL),
  },
];

const codeReady = fileChecks.every((check) => check.passed);
const productionConfigured =
  codeReady &&
  environmentChecks.every((check) => check.passed);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  codeReady,
  productionConfigured,
  fileChecks,
  environmentChecks,
  capabilities: {
    passwordHashing: "scrypt",
    opaqueSessions: true,
    storedSessionTokens: false,
    emailVerification: true,
    passwordReset: true,
    subscriptionLinking: true,
    localDevelopmentStore: true,
    productionDatabaseAdapter: false,
    productionEmailDelivery: false,
  },
};

fs.writeFileSync(
  path.join(reports, "UAOS_ACCOUNTS_READINESS.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const mark = (passed) => (passed ? "[x]" : "[ ]");

const markdown = [
  "# UAOS Accounts and Authentication Readiness",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `Code ready: ${codeReady}`,
  `Production configured: ${productionConfigured}`,
  "",
  "## Files",
  "",
  ...fileChecks.map(
    (check) => `- ${mark(check.passed)} ${check.name}`,
  ),
  "",
  "## Production configuration",
  "",
  ...environmentChecks.map(
    (check) => `- ${mark(check.passed)} ${check.name}`,
  ),
  "",
  "## Security",
  "",
  "- Passwords use scrypt with per-user salts.",
  "- Raw session, verification and reset tokens are not stored.",
  "- Password reset revokes existing sessions.",
  "- Development tokens are hidden automatically in production mode.",
  "- Production still requires a managed database and email provider.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reports, "UAOS_ACCOUNTS_READINESS.md"),
  markdown,
  "utf8",
);

console.log(`Accounts code ready: ${codeReady}`);
console.log(
  `Accounts production configured: ${productionConfigured}`,
);

const strict = process.argv.includes("--strict-production");

if (!codeReady) {
  process.exit(1);
}

if (strict && !productionConfigured) {
  process.exit(2);
}