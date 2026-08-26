#!/usr/bin/env node
/**
 * Independent QA lane for one frozen SKU candidate (QA-A or QA-B).
 * Fresh validation — does not trust the other lane's output.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSafeDiagnostics } from "../backend/src/productRuntime/diagnosticsSafe.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function runSkuExpr(skuAbsPath, expr) {
  const abs = path.resolve(skuAbsPath);
  const code = `import(${JSON.stringify(pathToFileURL(abs).href)}).then(m=>console.log(JSON.stringify(${expr}))).catch(e=>{console.error(e);process.exit(1)})`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 180000
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "sku qa failed");
  const line = r.stdout.trim().split("\n").filter(Boolean).pop();
  return JSON.parse(line);
}

function verifySha256Sums(candidateDir) {
  const sumsPath = path.join(candidateDir, "SHA256SUMS.txt");
  if (!fs.existsSync(sumsPath)) return { ok: false, errorCode: "SHA256SUMS_MISSING" };
  const lines = fs.readFileSync(sumsPath, "utf8").trim().split("\n").filter(Boolean);
  const mismatches = [];
  for (const line of lines) {
    const m = line.match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (!m) continue;
    const file = path.join(candidateDir, m[2].replace(/\//g, path.sep));
    if (!fs.existsSync(file)) {
      mismatches.push({ file: m[2], error: "MISSING" });
      continue;
    }
    const hash = sha256File(file);
    if (hash !== m[1].toLowerCase()) mismatches.push({ file: m[2], expected: m[1], actual: hash });
  }
  return { ok: mismatches.length === 0, checked: lines.length, mismatches };
}

function secretsScanDiagnostics() {
  const diag = buildSafeDiagnostics({
    product: "QA",
    version: "test",
    productState: { password: "secret123", token: "abc", path: "C:\\Users\\owner\\secret" },
    recentErrors: [{ authorization: "Bearer xyz" }]
  });
  const raw = JSON.stringify(diag.bundle);
  const leaked =
    raw.includes("secret123") ||
    raw.includes("Bearer xyz") ||
    /\\Users\\owner/i.test(raw);
  return { ok: !leaked && diag.ok, sha256: diag.sha256 };
}

function commanderScan(candidateDir) {
  const hits = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name === "node_modules") continue;
        if (/^commander$/i.test(name)) hits.push(path.relative(candidateDir, full));
        walk(full);
      }
    }
  }
  walk(candidateDir);
  return { ok: hits.length === 0, hits };
}

const SKU_CFG = {
  ARRANGER: {
    skuRel: (c) => path.join(c, "PRODUCT/backend/src/sku/arrangerStudioSku.js"),
    workflows: "m.runAllCustomerWorkflows()",
    clean: "m.runCleanInstallEquivalent()",
    startBat: "START-UAOS-ARRANGER-STUDIO.bat",
    product: "UAOS Arranger Studio"
  },
  MIDI: {
    skuRel: (c) => path.join(c, "PRODUCT/backend/src/sku/midiToolkitSku.js"),
    workflows: "m.runAllMidiCustomerWorkflows()",
    clean: "m.runMidiCleanInstallEquivalent()",
    startBat: "START-UAOS-MIDI-TOOLKIT.bat",
    product: "UAOS MIDI Toolkit"
  },
  SINGY: {
    skuRel: (c) => path.join(c, "PRODUCT/backend/src/sku/singySku.js"),
    workflows: "m.runAllSingyCustomerWorkflows()",
    clean: "m.runSingyCleanInstallEquivalent()",
    startBat: "START-SINGY.bat",
    product: "Singy"
  }
};

export function runSkuQaLane({ sku, lane, candidateDir, candidateHash }) {
  const cfg = SKU_CFG[sku];
  if (!cfg) throw new Error(`Unknown SKU ${sku}`);
  const started = Date.now();
  const checks = [];
  const fail = (name, detail) => checks.push({ name, ok: false, detail });
  const pass = (name, detail = {}) => checks.push({ name, ok: true, ...detail });

  if (!fs.existsSync(candidateDir)) {
    fail("CANDIDATE_EXISTS", candidateDir);
  } else {
    pass("CANDIDATE_EXISTS", { path: candidateDir });
  }

  const actualHash = fs.existsSync(path.join(candidateDir, "SHA256SUMS.txt"))
    ? sha256File(path.join(candidateDir, "SHA256SUMS.txt"))
    : sha256File(candidateDir);
  if (candidateHash && actualHash !== candidateHash) {
    fail("CANDIDATE_HASH", { expected: candidateHash, actual: actualHash });
  } else {
    pass("CANDIDATE_HASH", { hash: candidateHash || actualHash });
  }

  for (const req of ["README_FIRST.txt", "RIGHTS_SEAL.json", cfg.startBat, "SHA256SUMS.txt"]) {
    const p = path.join(candidateDir, req);
    fs.existsSync(p) ? pass(`FILE_${req}`, { path: req }) : fail(`FILE_${req}`, req);
  }

  const rights = readJson(path.join(candidateDir, "RIGHTS_SEAL.json"), {});
  rights.UNCLEARED_SHIPPED_ASSETS === 0 ? pass("RIGHTS_SEAL") : fail("RIGHTS_SEAL", rights);

  const sums = verifySha256Sums(candidateDir);
  sums.ok ? pass("MANIFEST_INTEGRITY", { checked: sums.checked }) : fail("MANIFEST_INTEGRITY", sums);

  const cmd = commanderScan(candidateDir);
  cmd.ok ? pass("NO_COMMANDER") : fail("NO_COMMANDER", cmd);

  const diag = secretsScanDiagnostics();
  diag.ok ? pass("DIAGNOSTICS_SECRET_SCAN") : fail("DIAGNOSTICS_SECRET_SCAN", diag);

  let workflows = { ok: false };
  let clean = { ok: false };
  try {
    const skuPath = cfg.skuRel(candidateDir);
    workflows = runSkuExpr(skuPath, cfg.workflows);
    clean = runSkuExpr(skuPath, cfg.clean);
    workflows.ok ? pass("CORE_WORKFLOWS", { pass: workflows.pass, total: workflows.total, p0: workflows.p0 }) : fail("CORE_WORKFLOWS", workflows);
    clean.ok || clean.CLEAN_INSTALL_PASS ? pass("CLEAN_INSTALL", clean) : fail("CLEAN_INSTALL", clean);
  } catch (e) {
    fail("SKU_MODULE", e.message);
  }

  const p0 = (workflows.p0 || 0) + (checks.filter((c) => !c.ok && c.name.includes("P0")).length);
  const p1 = workflows.fail || checks.filter((c) => !c.ok).length;
  const allOk = checks.every((c) => c.ok);

  return {
    schema: "uaos.final-double-qa.lane/v1",
    sku,
    lane,
    QA_PASS: allOk ? "YES" : "NO",
    startedAt: new Date(started).toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    candidateDir,
    candidateHash: candidateHash || actualHash,
    product: cfg.product,
    checks,
    P0: allOk ? 0 : Math.max(1, workflows.p0 || 0),
    P1: allOk ? 0 : p1,
    workflows,
    clean,
    COMMANDER_TOUCHED: false
  };
}

if (process.argv[1] && process.argv[1].includes("final-double-qa-lane")) {
  const sku = process.argv[2];
  const lane = process.argv[3];
  const candidateDir = path.resolve(process.argv[4]);
  const candidateHash = process.argv[5] || null;
  const outDir = path.join(ROOT, "reports", "final-double-qa", sku.toLowerCase());
  fs.mkdirSync(outDir, { recursive: true });
  const result = runSkuQaLane({ sku, lane, candidateDir, candidateHash });
  const outFile = path.join(outDir, `QA_${lane}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ sku, lane, QA_PASS: result.QA_PASS, outFile, P0: result.P0, P1: result.P1 }));
  process.exit(result.QA_PASS === "YES" ? 0 : 1);
}
