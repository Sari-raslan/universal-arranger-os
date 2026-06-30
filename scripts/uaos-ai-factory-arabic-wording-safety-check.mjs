import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pack = path.join(root, "uaos-ai-factory/local-demo-evidence-pack");
const files = readdirSync(pack).filter((file) => file.includes("_AR") || file.includes("ARABIC"));
const forbidden = [
  "جاهز للبيع",
  "جاهز للنشر العام",
  "مضمون الربح",
  "دفع مفعل",
  "تصدير كيبورد حقيقي جاهز",
  "نقل إلى الأورغ جاهز",
  "إصدار إنتاجي"
];
const failures = [];
for (const file of files) {
  const lines = readFileSync(path.join(pack, file), "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const phrase of forbidden) {
      if (!line.includes(phrase)) continue;
      const before = line.slice(0, line.indexOf(phrase));
      const negated = before.includes("لا ") || before.includes("ليس ") || before.includes("ليست ");
      if (!negated) failures.push(`${phrase} in ${file}:${index + 1}`);
    }
  }
}
const status = { schema: "uaos-arabic-wording-safety-status-v1", status: failures.length ? "FAIL" : "PASS", files, forbidden, failures };
writeFileSync(path.join(root, "uaos-ai-factory/ARABIC_WORDING_SAFETY_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/ARABIC_WORDING_SAFETY_STATUS.md"), `# Arabic Wording Safety Status\n\nStatus: ${status.status}\n\nFailures:\n${failures.length ? failures.map((f) => `- ${f}`).join("\n") : "- None"}\n`);
console.log("UAOS Arabic Wording Safety Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Arabic Wording Safety Check: PASS");
