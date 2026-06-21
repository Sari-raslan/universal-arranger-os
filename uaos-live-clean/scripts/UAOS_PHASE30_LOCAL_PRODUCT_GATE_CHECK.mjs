import fs from "node:fs";

const required = [
  "src/hardware/uaosHardwareExportLayer.js",
  "src/hardware/uaosHardwareIntegration.js",
  "public/phase28-hardware-export.html",
  "public/phase29-hardware-integration.html",
  "public/phase30-local-product-gate.html",
  "scripts/UAOS_PHASE28_HARDWARE_EXPORT_CHECK.mjs",
  "scripts/UAOS_PHASE29_HARDWARE_INTEGRATION_CHECK.mjs"
];

for (const file of required) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 30 LOCAL PRODUCT GATE CHECK PASS");
