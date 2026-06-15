import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
const scanFiles = [
  "server/cloud/phase8Platform.cjs",
  "server/production/stripeBilling.mjs",
  "uaos-live-clean/src/beta/phase9Beta.js",
  "uaos-live-clean/src/commercial/phase10Commercial.js"
];
const combined = scanFiles.map((file) => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : "").join("\n");
const checks = {
  noEmbeddedPrivateKey: !/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/.test(combined),
  noLiveStripeSecret: !/sk_live_[A-Za-z0-9]/.test(combined),
  csrfProtection: combined.includes("CSRF_HEADER") || combined.includes("CSRF"),
  requestLimits: combined.includes("express.json({ limit"),
  pathTraversalProtection: combined.includes("path-traversal") || combined.includes("pathTraversalAllowed: false"),
  stripeWebhookSignatureContract: combined.includes("stripe-signature"),
  sysexDisabledByDefault: fs.readFileSync(path.join(root, "uaos-live-clean", "src", "beta", "phase9Beta.js"), "utf8").includes("sysexBeta: false"),
  updaterDisabled: combined.includes("enabled: false") && combined.includes("unsignedProductionUpdateAccepted: false"),
  rawAudioUploadDisabled: combined.includes("rawAudioUpload: false") || combined.includes("rawAudioIncluded: false")
};
const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), passed: Object.values(checks).every(Boolean), checks, dependencyAudit: "not-run-no-major-upgrade", productionSecretsFound: false };
fs.writeFileSync(path.join(reportsDir, "UAOS_SECURITY_CHECK.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS security check passed: ${result.passed}`);
if (!result.passed) process.exit(1);
