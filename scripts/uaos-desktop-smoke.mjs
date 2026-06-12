import fs from "node:fs";
import path from "node:path";

const dist = path.join(process.cwd(), "uaos-live-clean", "dist", "index.html");
const preload = path.join(process.cwd(), "desktop", "preload.cjs");
const main = path.join(process.cwd(), "desktop", "main.cjs");

for (const file of [dist, preload, main]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing desktop smoke target: ${path.relative(process.cwd(), file)}`);
    process.exit(1);
  }
}

const mainText = fs.readFileSync(main, "utf8");
if (mainText.includes("vercel.app") || mainText.includes("nodeIntegration: true")) {
  console.error("Desktop smoke failed: unsafe production fallback or nodeIntegration found.");
  process.exit(1);
}

console.log("UAOS desktop smoke check passed");
