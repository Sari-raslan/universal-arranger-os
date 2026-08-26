/**
 * Port manager + project store unit tests
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  resolveStartPort,
  writeOwnPid,
  clearOwnPid,
  customerErrorText
} from "../backend/src/productRuntime/portManager.js";
import {
  saveProject,
  reopenProject,
  handleCorruptProject,
  uniqueExportPath,
  autosaveProject
} from "../backend/src/productRuntime/projectStore.js";
import { buildSafeDiagnostics, redactValue } from "../backend/src/productRuntime/diagnosticsSafe.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "uaos-v14-"));

{
  const r = await resolveStartPort({
    preferredPort: 59199,
    dataDir: tmp,
    productId: "Arranger",
    altPorts: [59200, 59201]
  });
  assert.ok(["start", "start_alt"].includes(r.action), JSON.stringify(r));
}

{
  writeOwnPid(tmp, { port: 59199, product: "Arranger", version: "v14" });
  clearOwnPid(tmp);
  assert.equal(fs.existsSync(path.join(tmp, "runtime.pid.json")), false);
}

{
  const saved = saveProject(tmp, { title: "Test", tempo: 96 });
  assert.equal(saved.ok, true);
  const re = reopenProject(tmp, saved.projectId);
  assert.equal(re.ok, true);
  assert.equal(re.project.title, "Test");
  autosaveProject(tmp, { title: "Auto", tempo: 100 });
  const auto = reopenProject(tmp, null);
  assert.equal(auto.ok, true);
}

{
  const id = "corrupt-me";
  fs.mkdirSync(path.join(tmp, "projects"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "projects", `${id}.json`), "{bad");
  const q = handleCorruptProject(tmp, id);
  assert.equal(q.ok, true);
}

{
  const a = uniqueExportPath(tmp, "export.mid");
  fs.writeFileSync(a, "x");
  const b = uniqueExportPath(tmp, "export.mid");
  assert.notEqual(a, b);
}

{
  assert.equal(redactValue("password", "secret"), "[REDACTED]");
  assert.match(redactValue("path", "C:\\Users\\ssare\\secret"), /USER_HOME/);
  const d = buildSafeDiagnostics({ product: "Test", version: "v14", productState: { token: "x" } });
  assert.equal(d.ok, true);
  assert.equal(d.bundle.productState.token, "[REDACTED]");
}

{
  const e = customerErrorText("PORT_BUSY_BY_OTHER_APP", "busy");
  assert.ok(e.hint.length > 0);
}

console.log("product-runtime.test.mjs: PASS");
