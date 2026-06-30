import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pack = path.join(root, "uaos-ai-factory/local-demo-evidence-pack");
const files = readdirSync(pack).filter((file) => file.endsWith("_DE.md") || file.includes("_DE_") || file.includes("JOBCENTER") || file.includes("SUPPORTER"));
const forbidden = [
  "produktionsreif",
  "öffentliche veröffentlichung bereit",
  "zahlung aktiviert",
  "keyboard-export fertig",
  "echtes keyboard-format fertig",
  "garantiertes einkommen",
  "sichere einnahmen",
  "vercel bereit",
  "deployment bereit"
];
const failures = [];
for (const file of files) {
  const text = readFileSync(path.join(pack, file), "utf8").toLowerCase();
  for (const phrase of forbidden) if (text.includes(phrase)) failures.push(`${phrase} in ${file}`);
}
const status = { schema: "uaos-german-wording-safety-status-v1", status: failures.length ? "FAIL" : "PASS", files, forbidden, failures };
writeFileSync(path.join(root, "uaos-ai-factory/GERMAN_WORDING_SAFETY_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/GERMAN_WORDING_SAFETY_STATUS.md"), `# German Wording Safety Status\n\nStatus: ${status.status}\n\nFailures:\n${failures.length ? failures.map((f) => `- ${f}`).join("\n") : "- None"}\n`);
console.log("UAOS German Wording Safety Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS German Wording Safety Check: PASS");

