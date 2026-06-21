import fs from "node:fs";

const requiredFiles = [
  "public/phase35-hardware-qa-index.html",
  "public/phase40-final-hardware-export-gate.html",
  "public/phase41-binary-exporter-foundation.html",
  "public/phase42-binary-adapter-integration.html",
  "public/phase43-final-binary-hardware-qa-index.html"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required QA page: ${file}`);
  }
  console.log(`OK ${file}`);
}

const html = fs.readFileSync("public/phase43-final-binary-hardware-qa-index.html", "utf8");

const requiredLinks = [
  "./phase35-hardware-qa-index.html",
  "./phase40-final-hardware-export-gate.html",
  "./phase41-binary-exporter-foundation.html",
  "./phase42-binary-adapter-integration.html"
];

for (const link of requiredLinks) {
  if (!html.includes(link)) {
    throw new Error(`Missing link: ${link}`);
  }
  console.log(`OK link ${link}`);
}

console.log("PHASE 43 FINAL BINARY HARDWARE QA INDEX CHECK PASS");
