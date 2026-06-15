import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
const reportsDirectory = path.join(root, "reports");

fs.mkdirSync(reportsDirectory, {
  recursive: true,
});

function readJson(relativePath) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function fileCheck(name, relativePath) {
  return {
    name,
    passed: fs.existsSync(path.join(root, relativePath)),
  };
}

const approvals =
  readJson("config/launch-approvals.json") || {};

const codeChecks = [
  fileCheck(
    "accounts-backend",
    "server/accounts/accountService.mjs",
  ),
  fileCheck(
    "accounts-frontend",
    "uaos-live-clean/src/components/AccountShell.jsx",
  ),
  fileCheck(
    "postgres-adapter",
    "server/production/postgresAccountRepository.mjs",
  ),
  fileCheck(
    "smtp-adapter",
    "server/production/smtpEmailService.mjs",
  ),
  fileCheck(
    "stripe-billing-code",
    "server/production/stripeBilling.mjs",
  ),
  fileCheck(
    "accounts-migration",
    "migrations/001_accounts.sql",
  ),
  fileCheck(
    "billing-migration",
    "migrations/002_stripe_billing.sql",
  ),
  fileCheck(
    "founders-pricing-test",
    "tests/founders-pricing.test.mjs",
  ),
  fileCheck(
    "impressum-draft",
    "docs/legal/IMPRESSUM_DRAFT.md",
  ),
  fileCheck(
    "privacy-draft",
    "docs/legal/PRIVACY_POLICY_DRAFT.md",
  ),
  fileCheck(
    "terms-draft",
    "docs/legal/TERMS_DRAFT.md",
  ),
  fileCheck(
    "cancellation-draft",
    "docs/legal/CANCELLATION_REFUND_DRAFT.md",
  ),
  fileCheck(
    "cookie-draft",
    "docs/legal/COOKIE_POLICY_DRAFT.md",
  ),
];

let stripeSdkInstalled = false;

try {
  require.resolve("stripe");
  stripeSdkInstalled = true;
} catch {
  stripeSdkInstalled = false;
}

const externalChecks = [
  "legalApproval",
  "privacyApproval",
  "paymentTestModeApproval",
  "productionDatabaseApproval",
  "smtpDeliveryApproval",
  "physicalHardwareApproval",
  "windowsSigningApproval",
  "publicDeploymentApproval",
].map((name) => ({
  name,
  passed: approvals[name] === true,
}));

const pricing = readJson(
  "reports/UAOS_FOUNDERS_PRICING.json",
);
const windows = readJson(
  "reports/UAOS_WINDOWS_PACKAGE_READINESS.json",
);
const stripe = readJson(
  "reports/UAOS_STRIPE_READINESS.json",
);
const accounts = readJson(
  "reports/UAOS_ACCOUNTS_READINESS.json",
);
const production = readJson(
  "reports/UAOS_PRODUCTION_INTEGRATIONS_READINESS.json",
);

const reportChecks = [
  {
    name: "founders-pricing-report",
    passed:
      Boolean(pricing) &&
      pricing.checkoutEnabled === false,
  },
  {
    name: "windows-code-package",
    passed:
      Boolean(windows) &&
      windows.codePackagingReady === true,
  },
  {
    name: "stripe-code",
    passed:
      Boolean(stripe) &&
      stripe.codeReady === true,
  },
  {
    name: "accounts-code",
    passed:
      Boolean(accounts) &&
      accounts.codeReady === true,
  },
  {
    name: "production-integration-code",
    passed:
      Boolean(production) &&
      production.codeReady === true,
  },
];

const codeReady = [
  ...codeChecks,
  ...reportChecks,
].every((check) => check.passed);

const externalApprovalsComplete =
  externalChecks.every((check) => check.passed);

const productionActivationReady =
  codeReady &&
  stripeSdkInstalled &&
  stripe?.productionConfigured === true &&
  accounts?.productionConfigured === true &&
  production?.productionConfigured === true &&
  windows?.signedCommercialInstallerReady === true &&
  externalApprovalsComplete;

const status = productionActivationReady
  ? "PRODUCTION_ACTIVATION_APPROVED"
  : codeReady
    ? "CODE_READY_EXTERNAL_APPROVALS_REQUIRED"
    : "CODE_GATE_HAS_BLOCKERS";

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status,
  codeReady,
  stripeSdkInstalled,
  externalApprovalsComplete,
  productionActivationReady,
  codeChecks,
  reportChecks,
  externalChecks,
  safety: {
    paymentExecuted: false,
    migrationExecuted: false,
    commitExecuted: false,
    pushExecuted: false,
    mergeExecuted: false,
    deploymentExecuted: false,
  },
};

fs.writeFileSync(
  path.join(
    reportsDirectory,
    "UAOS_FINAL_LAUNCH_GATE.json",
  ),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const mark = (passed) => (passed ? "[x]" : "[ ]");

fs.writeFileSync(
  path.join(
    reportsDirectory,
    "UAOS_FINAL_LAUNCH_GATE.md",
  ),
  [
    "# UAOS Final Launch Gate",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    `Status: ${status}`,
    `Code ready: ${codeReady}`,
    `Stripe SDK installed: ${stripeSdkInstalled}`,
    `External approvals complete: ${externalApprovalsComplete}`,
    `Production activation ready: ${productionActivationReady}`,
    "",
    "## Code and report checks",
    "",
    ...[...codeChecks, ...reportChecks].map(
      (check) => `- ${mark(check.passed)} ${check.name}`,
    ),
    "",
    "## External approvals",
    "",
    ...externalChecks.map(
      (check) => `- ${mark(check.passed)} ${check.name}`,
    ),
    "",
    "No payment, migration, commit, merge or deployment was executed.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`UAOS launch gate status: ${status}`);
console.log(`Code ready: ${codeReady}`);
console.log(
  `Production activation ready: ${productionActivationReady}`,
);

if (!codeReady) {
  process.exit(1);
}