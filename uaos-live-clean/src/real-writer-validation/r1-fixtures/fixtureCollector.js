import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const UAOS_R1_VERSION = "R1.0.0";

export const SUPPORTED_FIXTURE_EXTENSIONS = [
  ".sty",
  ".set",
  ".prs",
  ".stl",
  ".pat",
  ".msp",
  ".kst",
  ".mid",
  ".kar"
];

export const TARGET_HINTS = {
  ".sty": ["yamaha", "korg"],
  ".set": ["korg"],
  ".prs": ["roland"],
  ".stl": ["roland"],
  ".pat": ["ketron"],
  ".msp": ["ketron"],
  ".kst": ["ketron"],
  ".mid": ["generic-midi"],
  ".kar": ["generic-midi"]
};

function normalizeExt(file) {
  return path.extname(file || "").toLowerCase();
}

function safeStat(file) {
  try {
    return fs.statSync(file);
  } catch {
    return null;
  }
}

function sha256SmallMetadata(file, stat) {
  const text = `${file}|${stat.size}|${stat.mtimeMs}`;
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function scanFixtureFolder(root, options = {}) {
  const maxFiles = options.maxFiles || 5000;
  const includeHidden = options.includeHidden === true;
  const extensions = new Set((options.extensions || SUPPORTED_FIXTURE_EXTENSIONS).map((x) => x.toLowerCase()));
  const results = [];

  function walk(dir) {
    if (results.length >= maxFiles) return;

    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;

      if (!includeHidden && entry.name.startsWith(".")) continue;

      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = normalizeExt(entry.name);
      if (!extensions.has(ext)) continue;

      const stat = safeStat(full);
      if (!stat) continue;

      results.push({
        fileName: entry.name,
        fullPath: full,
        folder: dir,
        extension: ext,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        targetHints: TARGET_HINTS[ext] || ["unknown"],
        metadataHash: sha256SmallMetadata(full, stat),
        copied: false,
        readBinaryContent: false,
        note: "R1 indexes metadata only. It does not copy or parse proprietary binary content."
      });
    }
  }

  if (fs.existsSync(root)) {
    walk(root);
  }

  return results;
}

export function createFixtureCollectionReport(input = {}) {
  const roots = input.roots || [];
  const options = input.options || {};
  const scans = roots.map((root) => ({
    root,
    exists: fs.existsSync(root),
    fixtures: fs.existsSync(root) ? scanFixtureFolder(root, options) : []
  }));

  const allFixtures = scans.flatMap((scan) => scan.fixtures);
  const byExtension = {};
  const byTarget = {};

  for (const fixture of allFixtures) {
    byExtension[fixture.extension] = (byExtension[fixture.extension] || 0) + 1;
    for (const target of fixture.targetHints) {
      byTarget[target] = (byTarget[target] || 0) + 1;
    }
  }

  return {
    format: "UAOS_R1_FIXTURE_COLLECTION_REPORT",
    version: UAOS_R1_VERSION,
    phase: "R1",
    program: "Real Keyboard Binary Writer Validation Program",
    status: "PASS",
    roots,
    scanCount: scans.length,
    fixtureCount: allFixtures.length,
    byExtension,
    byTarget,
    scans,
    safety: {
      metadataOnly: true,
      copiedFiles: false,
      parsedBinaryContent: false,
      wroteRealKeyboardBinary: false,
      realKeyboardBinaryWriteAllowed: false,
      warning: "R1 only indexes user-owned fixture metadata. It does not copy, parse, or generate proprietary keyboard binary files."
    },
    nextPhase: {
      id: "R2",
      name: "Read-only Binary Analyzer",
      condition: "Use only fixtures the user owns and explicitly approves for analysis."
    }
  };
}

export function validateFixtureCollectionReport(report) {
  const errors = [];

  if (report?.format !== "UAOS_R1_FIXTURE_COLLECTION_REPORT") errors.push("Invalid report format.");
  if (report?.phase !== "R1") errors.push("Phase must be R1.");
  if (report?.safety?.metadataOnly !== true) errors.push("R1 must be metadata only.");
  if (report?.safety?.copiedFiles !== false) errors.push("R1 must not copy fixture files.");
  if (report?.safety?.parsedBinaryContent !== false) errors.push("R1 must not parse binary content.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("R1 must not write keyboard binary.");
  if (report?.safety?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");

  return { ok: errors.length === 0, errors };
}
