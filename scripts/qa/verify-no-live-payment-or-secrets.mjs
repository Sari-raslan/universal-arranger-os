import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");
const file = path.join(app, "public", "uaos-production-doctor.json");

function fail(message) {
  console.error("[FAIL] " + message);
  process.exit(1);
}

if (!fs.existsSync(file)) {
  fail("Missing uaos-production-doctor.json");
}

const text = fs.readFileSync(file, "utf8");
const data = JSON.parse(text);

const forbidden = [
  /sk_live_/i,
  /pk_live_/i,
  /stripe_live/i,
  /paypal_live/i,
  /live_checkout/i,
  /checkout_live/i,
  /client_secret/i,
  /api_secret/i,
  /secret_key/i,
  /private_key/i,
  /access_token/i,
  /refresh_token/i
];

for (const pattern of forbidden) {
  if (pattern.test(text)) {
    fail("Forbidden live payment or secret text still found: " + pattern);
  }
}

if (data.liveProduction !== false) fail("liveProduction must be false.");
if (data.deploy !== false) fail("deploy must be false.");
if (data.payments?.livePayments !== false) fail("livePayments must be false.");
if (data.secrets?.containsSecrets !== false) fail("containsSecrets must be false.");
if (data.releaseLocks?.noLivePayment !== true) fail("noLivePayment lock must be true.");
if (data.releaseLocks?.noSecrets !== true) fail("noSecrets lock must be true.");

console.log("UAOS NO LIVE PAYMENT OR SECRETS QA PASS");
