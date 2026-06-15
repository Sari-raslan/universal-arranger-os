import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const configPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, "config", "library-roots.json");

const supportedExtensions = new Set([
  ".wav",
  ".aif",
  ".aiff",
  ".flac",
  ".sfz",
  ".mid",
  ".midi",
  ".json",
]);

const excludedNames = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".gradle",
  ".cache",
  "windows",
  "program files",
  "program files (x86)",
]);

const reportsDir = path.join(repoRoot, "reports");
const cacheDir = path.join(repoRoot, ".uaos-cache");
const cachePath = path.join(cacheDir, "library-scan-cache.json");
const jsonReportPath = path.join(reportsDir, "UAOS_LIBRARY_SCAN_REPORT.json");
const markdownReportPath = path.join(reportsDir, "UAOS_LIBRARY_SCAN_REPORT.md");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeConfiguredRoot(rootValue) {
  const resolved = path.resolve(rootValue);
  const parsed = path.parse(resolved);

  if (resolved === parsed.root) {
    throw new Error(`Refusing to scan a filesystem root: ${resolved}`);
  }

  return resolved;
}

async function hashFile(filePath) {
  const handle = await fs.open(filePath, "r");
  const hash = crypto.createHash("sha256");

  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let position = 0;

    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
  } finally {
    await handle.close();
  }

  return hash.digest("hex");
}

async function walk(root, current, entries, cache, nextCache) {
  const directoryEntries = await fs.readdir(current, { withFileTypes: true });

  for (const entry of directoryEntries) {
    const fullPath = path.join(current, entry.name);
    const lowerName = entry.name.toLowerCase();

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (excludedNames.has(lowerName)) {
        continue;
      }
      await walk(root, fullPath, entries, cache, nextCache);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!supportedExtensions.has(extension)) {
      continue;
    }

    const stat = await fs.stat(fullPath);
    const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");
    const cacheKey = fullPath;
    const cached = cache.files?.[cacheKey];

    let sha256;
    let hashSource = "calculated";

    if (
      cached &&
      cached.size === stat.size &&
      cached.mtimeMs === stat.mtimeMs &&
      cached.sha256
    ) {
      sha256 = cached.sha256;
      hashSource = "cache";
    } else {
      sha256 = await hashFile(fullPath);
    }

    nextCache.files[cacheKey] = {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      sha256,
    };

    entries.push({
      root,
      relativePath,
      extension,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sha256,
      hashSource,
      metadataStatus: "basic-file-metadata-only",
    });
  }
}

const config = await readJson(configPath, { roots: [] });
const cache = await readJson(cachePath, { schemaVersion: 1, files: {} });
const nextCache = { schemaVersion: 1, generatedAt: new Date().toISOString(), files: {} };
const entries = [];
const errors = [];
const roots = [];

for (const configuredRoot of config.roots || []) {
  try {
    const root = normalizeConfiguredRoot(configuredRoot);
    const stat = await fs.stat(root);

    if (!stat.isDirectory()) {
      throw new Error("Configured root is not a directory");
    }

    roots.push(root);
    await walk(root, root, entries, cache, nextCache);
  } catch (error) {
    errors.push({
      root: configuredRoot,
      message: error.message,
    });
  }
}

const duplicateGroups = Object.values(
  entries.reduce((groups, item) => {
    groups[item.sha256] ||= [];
    groups[item.sha256].push(item);
    return groups;
  }, {}),
).filter((group) => group.length > 1);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  configuredRoots: config.roots || [],
  scannedRoots: roots,
  assetCount: entries.length,
  duplicateGroupCount: duplicateGroups.length,
  errors,
  entries,
  duplicateGroups,
  safety: {
    sourceFilesMoved: false,
    sourceFilesDeleted: false,
    filesystemRootsAllowed: false,
    symbolicLinksFollowed: false,
  },
};

await fs.mkdir(reportsDir, { recursive: true });
await fs.mkdir(cacheDir, { recursive: true });
await fs.writeFile(cachePath, JSON.stringify(nextCache, null, 2) + "\n", "utf8");
await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

const markdown = [
  "# UAOS Library Scan Report",
  "",
  `Generated: ${report.generatedAt}`,
  `Configured roots: ${report.configuredRoots.length}`,
  `Scanned roots: ${report.scannedRoots.length}`,
  `Assets found: ${report.assetCount}`,
  `Duplicate groups: ${report.duplicateGroupCount}`,
  `Errors: ${report.errors.length}`,
  "",
  "## Safety",
  "",
  "- No source file was moved.",
  "- No source file was deleted.",
  "- Filesystem roots are rejected.",
  "- Symbolic links are not followed.",
  "- Audio metadata is currently limited to safe basic file metadata.",
  "",
  "## Configuration",
  "",
  report.configuredRoots.length
    ? report.configuredRoots.map((root) => `- ${root}`).join("\n")
    : "- No library roots configured yet.",
  "",
  "NOT MERGED / NOT DEPLOYED",
].join("\n");

await fs.writeFile(markdownReportPath, markdown + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      status: "ok",
      assets: report.assetCount,
      duplicateGroups: report.duplicateGroupCount,
      errors: report.errors.length,
      jsonReportPath,
      markdownReportPath,
    },
    null,
    2,
  ),
);