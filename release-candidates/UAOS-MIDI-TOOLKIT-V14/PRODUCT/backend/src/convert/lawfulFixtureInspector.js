/**
 * Lawful fixture scanner — project-owned / generated samples only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectBuffer } from "./uaosNeutralIr.js";
import { detectFamilyWithEvidence } from "./familyDetection.js";
import { createFamilyAdapter } from "./familyAdapterContract.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const SCAN_ROOTS = [
  path.join(ROOT, "samples"),
  path.join(ROOT, "tests", "fixtures"),
  path.join(ROOT, "docs", "fixtures")
];

const EXTENSIONS = new Set([".set", ".sty", ".mid", ".midi", ".syx", ".pcg", ".kst", ".pad", ".prs"]);

export function scanLawfulFixtures({ roots = SCAN_ROOTS } = {}) {
  const results = [];
  const seen = new Set();

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    walk(root, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!EXTENSIONS.has(ext)) return;
      const norm = filePath.toLowerCase();
      if (seen.has(norm)) return;
      seen.add(norm);
      results.push(inspectFixtureFile(filePath));
    });
  }

  return {
    schema: "uaos.neutral-ir.fixture-scan/v1",
    generatedAt: new Date().toISOString(),
    rootsScanned: roots.filter((r) => fs.existsSync(r)),
    count: results.length,
    fixtures: results
  };
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

export function inspectFixtureFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const rel = path.relative(ROOT, filePath);
  const detection = detectFamilyWithEvidence(buffer, ext, null);
  const inspected = inspectBuffer(buffer, ext, detection.family);
  const adapter = createFamilyAdapter(detection.family);
  let toIr = { ok: false, errorCode: "NOT_ATTEMPTED" };
  try {
    toIr = adapter.toNeutralIR(buffer, ext);
  } catch (error) {
    toIr = { ok: false, errorCode: "TO_IR_EXCEPTION", message: error.message };
  }

  return {
    FILE: rel,
    SOURCE: "PROJECT_LAWFUL_FIXTURE",
    RIGHTS_PROVENANCE: rel.includes("synthetic") ? "UAOS_GENERATED_SYNTHETIC" : "PROJECT_OWNED_OR_LICENSED",
    EXTENSION: ext,
    DETECTED_FAMILY: detection.family,
    DETECTION_CONFIDENCE: detection.CONFIDENCE,
    HEADER_SIGNATURE: buffer.subarray(0, Math.min(16, buffer.length)).toString("hex"),
    READ_STATUS: adapter.capabilities.canRead ? (toIr.ok ? "LIMITED_VERIFIED" : "INSPECT_ONLY") : "INSPECT_ONLY",
    INSPECT_STATUS: inspected.ok ? "VERIFIED" : "INSPECT_ONLY",
    PARSE_STATUS: toIr.ok ? "LIMITED_VERIFIED" : detection.family === "midi" ? "LIMITED_VERIFIED" : "FORMAT_CONTRACT_REQUIRED",
    NEUTRAL_IR_STATUS: toIr.ok ? "LIMITED_VERIFIED" : "INSPECT_ONLY",
    ERROR: toIr.errorCode || null,
    detection,
    sizeBytes: buffer.length
  };
}
