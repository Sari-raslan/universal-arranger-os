import fs from "node:fs";

const requiredFiles = [
  "public/phase28-hardware-export.html",
  "public/phase29-hardware-integration.html",
  "public/phase30-local-product-gate.html",
  "public/phase34-real-hardware-roadmap.html",
  "public/phase35-hardware-qa-index.html"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required QA page: ${file}`);
  }
  console.log(`OK ${file}`);
}

const html = fs.readFileSync("public/phase35-hardware-qa-index.html", "utf8");

const requiredLinks = [
  "./phase28-hardware-export.html",
  "./phase29-hardware-integration.html",
  "./phase30-local-product-gate.html",
  "./phase34-real-hardware-roadmap.html"
];

for (const link of requiredLinks) {
  if (!html.includes(link)) {
    throw new Error(`Missing QA link: ${link}`);
  }
  console.log(`OK link ${link}`);
}

console.log("PHASE 35 HARDWARE QA INDEX CHECK PASS");
