import fs from "node:fs";

const page = "public/phase30-local-product-gate.html";
const html = fs.readFileSync(page, "utf8");

const required = [
  'href="./phase28-hardware-export.html"',
  'href="./phase29-hardware-integration.html"',
  './phase30-local-product-gate.html'
];

for (const item of required) {
  if (!html.includes(item)) {
    throw new Error(`Missing fixed link: ${item}`);
  }
  console.log(`OK ${item}`);
}

if (html.includes('href="/phase28-hardware-export.html"') || html.includes('href="/phase29-hardware-integration.html"')) {
  throw new Error("Old absolute links still found.");
}

console.log("PHASE 32 DASHBOARD LINKS CHECK PASS");
