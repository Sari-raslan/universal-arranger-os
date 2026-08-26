/**
 * Schema validation suite — validate core Program Tree JSON documents.
 */
import fs from "node:fs";
import path from "node:path";

const REQUIRED = [
  "PORTFOLIO.json",
  "PRODUCTS.json",
  "CAPABILITIES.json",
  "EPICS.json",
  "TASKS.json",
  "DEPENDENCIES.json",
  "RELEASE-TRAINS.json",
  "OWNER-GATES.json",
  "CURRENT-EXECUTION-STATE.json",
  "SECURITY-POLICY.json",
  "PRODUCT-TRUTH-MATRIX.json",
  "COMMERCIAL-READINESS-MATRIX.json",
  "COMMANDER-ADAPTER-CONTRACT.json"
];

export function runSchemaValidationSuite(treeRoot) {
  const root = treeRoot || path.join(process.cwd(), "uaos-program-tree");
  const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(root, f)));
  const checks = [];
  for (const file of REQUIRED.filter((f) => !missing.includes(f))) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
      const hasSchema = typeof doc.schema === "string" && doc.schema.startsWith("uaos.");
      checks.push({ file, ok: hasSchema, schema: doc.schema || null });
    } catch (err) {
      checks.push({ file, ok: false, error: String(err.message || err) });
    }
  }
  let tasksOk = false;
  try {
    const tasks = JSON.parse(fs.readFileSync(path.join(root, "TASKS.json"), "utf8"));
    tasksOk = tasks.schema === "uaos.tasks/v1" && Array.isArray(tasks.tasks) && tasks.tasks.length === 1604;
  } catch {
    tasksOk = false;
  }
  const ok = missing.length === 0 && checks.every((c) => c.ok) && tasksOk;
  return {
    schema: "uaos.orchestration.schema-validation-suite/v1",
    ok,
    missing,
    checks,
    tasksOk,
    commanderActivated: false
  };
}
