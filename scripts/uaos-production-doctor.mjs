import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const reports = path.join(root, "reports");
const publicDir = path.join(root, "uaos-live-clean", "public");

fs.mkdirSync(reports, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

function present(name) {
  const value = process.env[name];
  return Boolean(value && String(value).trim());
}

function safePrefix(name) {
  const value = String(process.env[name] || "");
  if (!value) return null;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function urlCheck(name, protocols) {
  const value = process.env[name];
  if (!value) {
    return { name, passed: false, configured: false };
  }

  try {
    const parsed = new URL(value);
    return {
      name,
      passed: protocols.includes(parsed.protocol),
      configured: true,
      protocol: parsed.protocol,
      host: parsed.host,
    };
  } catch {
    return {
      name,
      passed: false,
      configured: true,
      error: "invalid-url",
    };
  }
}

let stripeSdkInstalled = false;
try {
  require.resolve("stripe");
  stripeSdkInstalled = true;
} catch {
  stripeSdkInstalled = false;
}

const stripeChecks = [
  "UAOS_STRIPE_SECRET_KEY",
  "UAOS_STRIPE_WEBHOOK_SECRET",
  "UAOS_STRIPE_PRICE_CREATOR_INTRO",
  "UAOS_STRIPE_PRICE_CREATOR_REGULAR",
  "UAOS_STRIPE_PRICE_PROFESSIONAL_INTRO",
  "UAOS_STRIPE_PRICE_PROFESSIONAL_REGULAR",
].map((name) => ({
  name,
  passed: present(name),
  valuePreview:
    name === "UAOS_STRIPE_SECRET_KEY"
      ? safePrefix(name)
      : undefined,
}));

const smtpChecks = [
  "UAOS_SMTP_HOST",
  "UAOS_SMTP_PORT",
  "UAOS_SMTP_USER",
  "UAOS_SMTP_PASSWORD",
  "UAOS_SMTP_FROM",
].map((name) => ({
  name,
  passed: present(name),
}));

const legalChecks = [
  "UAOS_LEGAL_APPROVED",
  "UAOS_PRIVACY_APPROVED",
  "UAOS_TERMS_APPROVED",
].map((name) => ({
  name,
  passed:
    String(process.env[name] || "").toLowerCase() === "true",
}));

const signingChecks = [
  {
    name: "UAOS_WINDOWS_SIGNING_CERTIFICATE",
    passed: present("UAOS_WINDOWS_SIGNING_CERTIFICATE"),
  },
  {
    name: "UAOS_WINDOWS_SIGNING_PASSWORD",
    passed: present("UAOS_WINDOWS_SIGNING_PASSWORD"),
  },
];

const database = urlCheck(
  "UAOS_DATABASE_URL",
  ["postgres:", "postgresql:"],
);

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  codeReady: true,
  stripeSdkInstalled,
  database,
  stripeChecks,
  smtpChecks,
  legalChecks,
  signingChecks,
  externalActivationReady:
    stripeSdkInstalled &&
    database.passed &&
    stripeChecks.every((check) => check.passed) &&
    smtpChecks.every((check) => check.passed) &&
    legalChecks.every((check) => check.passed) &&
    signingChecks.every((check) => check.passed),
  safety: {
    stripeRequestExecuted: false,
    chargeCreated: false,
    migrationExecuted: false,
    emailSent: false,
    deployed: false,
  },
};

const content = `${JSON.stringify(result, null, 2)}\n`;

fs.writeFileSync(
  path.join(reports, "UAOS_PRODUCTION_DOCTOR.json"),
  content,
  "utf8",
);

fs.writeFileSync(
  path.join(publicDir, "uaos-production-doctor.json"),
  content,
  "utf8",
);

console.log(`Production doctor code ready: ${result.codeReady}`);
console.log(`Stripe SDK installed: ${result.stripeSdkInstalled}`);
console.log(`Database configured: ${result.database.passed}`);
console.log(
  `Stripe secrets configured: ${
    result.stripeChecks.every((check) => check.passed)
  }`,
);
console.log(
  `SMTP configured: ${
    result.smtpChecks.every((check) => check.passed)
  }`,
);
console.log(
  `Legal approvals configured: ${
    result.legalChecks.every((check) => check.passed)
  }`,
);
console.log(
  `Windows signing configured: ${
    result.signingChecks.every((check) => check.passed)
  }`,
);
console.log(
  `External activation ready: ${result.externalActivationReady}`,
);

if (process.argv.includes("--strict") && !result.externalActivationReady) {
  process.exit(2);
}
