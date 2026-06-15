import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  readStripeConfig,
  stripeStatus,
} from "../server/production/stripeBilling.mjs";
import {
  foundersScheduleConfigured,
} from "../server/production/foundersStripeSchedule.mjs";

const root = process.cwd();
const reports = path.join(root, "reports");
const publicDirectory = path.join(
  root,
  "uaos-live-clean",
  "public",
);
const require = createRequire(import.meta.url);

fs.mkdirSync(reports, {
  recursive: true,
});
fs.mkdirSync(publicDirectory, {
  recursive: true,
});

const requiredFiles = [
  "migrations/002_stripe_billing.sql",
  "migrations/003_founders_subscription_schedule.sql",
  "server/production/stripeBilling.mjs",
  "server/production/foundersStripeSchedule.mjs",
  "server/production/commerceServer.mjs",
  "uaos-live-clean/src/api/billingClient.js",
  "tests/stripe-billing-cookie.test.mjs",
  "tests/stripe-founders-schedule.test.mjs",
  ".env.stripe.production.example",
];

const fileChecks = requiredFiles.map((relativePath) => ({
  name: relativePath,
  passed: fs.existsSync(
    path.join(root, relativePath),
  ),
}));

let sdkInstalled = false;

try {
  require.resolve("stripe");
  sdkInstalled = true;
} catch {
  sdkInstalled = false;
}

const stripe = stripeStatus(process.env);
const config = readStripeConfig(process.env, {
  strict: false,
});
const foundersScheduleReady =
  foundersScheduleConfigured(config);
const codeReady =
  fileChecks.every((check) => check.passed);
const productionConfigured =
  codeReady &&
  sdkInstalled &&
  stripe.configured &&
  (
    !config.foundersScheduleEnabled ||
    foundersScheduleReady
  );

const result = {
  schemaVersion: 4,
  generatedAt: new Date().toISOString(),
  codeReady,
  sdkInstalled,
  productionConfigured,
  foundersScheduleEnabled:
    config.foundersScheduleEnabled,
  foundersScheduleReady,
  foundersIntroMonths: 3,
  fileChecks,
  stripeChecks: stripe.checks,
  stripeRequestExecuted: false,
  chargeCreated: false,
  migrationExecuted: false,
};

const content =
  JSON.stringify(result, null, 2) + "\n";

fs.writeFileSync(
  path.join(
    reports,
    "UAOS_STRIPE_READINESS.json",
  ),
  content,
  "utf8",
);

fs.writeFileSync(
  path.join(
    publicDirectory,
    "uaos-stripe-readiness.json",
  ),
  content,
  "utf8",
);

console.log(`Stripe billing code ready: ${codeReady}`);
console.log(`Stripe SDK installed: ${sdkInstalled}`);
console.log(
  `Founders schedule enabled: ${config.foundersScheduleEnabled}`,
);
console.log(
  `Founders schedule configured: ${foundersScheduleReady}`,
);
console.log(
  `Stripe production configured: ${productionConfigured}`,
);

const strict = process.argv.includes("--strict");

if (!codeReady) {
  process.exit(1);
}

if (strict && !productionConfigured) {
  process.exit(2);
}

