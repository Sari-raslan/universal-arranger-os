const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");

function isWithinRoot(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  return (
    resolvedTarget === resolvedRoot ||
    resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  );
}

async function assertAllowedPath(targetPath, allowedRoots) {
  if (!targetPath || typeof targetPath !== "string") {
    const error = new Error("Path is required.");
    error.code = "INVALID_PATH";
    throw error;
  }

  const roots = (allowedRoots || [])
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => path.resolve(item));

  if (roots.length === 0) {
    const error = new Error("No scan roots are configured.");
    error.code = "NO_ALLOWED_ROOTS";
    throw error;
  }

  const resolved = path.resolve(targetPath);
  if (!roots.some((root) => isWithinRoot(resolved, root))) {
    const error = new Error("Path is outside the allowed roots.");
    error.code = "PATH_OUTSIDE_ALLOWED_ROOT";
    throw error;
  }

  const stat = await fsp.lstat(resolved);
  if (stat.isSymbolicLink()) {
    const error = new Error("Symbolic links are not allowed.");
    error.code = "SYMLINK_NOT_ALLOWED";
    throw error;
  }

  if (!stat.isDirectory()) {
    const error = new Error("Scan path must be a directory.");
    error.code = "NOT_A_DIRECTORY";
    throw error;
  }

  return resolved;
}

function classifySetResource(extension) {
  const ext = String(extension || "").toLowerCase();
  if (ext === ".sty" || ext === ".prs" || ext === ".kst") return "style_resource";
  if (ext === ".mid" || ext === ".midi" || ext === ".kar") return "midi_resource";
  if (ext === ".pcg" || ext === ".pad") return "keyboard_resource";
  if (ext === ".wav" || ext === ".aif" || ext === ".aiff") return "audio_resource";
  return "unsupported";
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const input = fs.createReadStream(filePath);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

function createSetScanner(options = {}) {
  const config = {
    allowedRoots: options.allowedRoots || [],
    maxDepth: Number(options.maxDepth || 8),
    maxFiles: Number(options.maxFiles || 2500),
    maxTotalBytes: Number(options.maxTotalBytes || 512 * 1024 * 1024),
    maxSingleFileBytes: Number(options.maxSingleFileBytes || 64 * 1024 * 1024)
  };

  async function scan(targetPath) {
    const rootPath = await assertAllowedPath(targetPath, config.allowedRoots);
    const files = [];
    const warnings = [];
    let fileCount = 0;
    let totalBytes = 0;

    async function walk(currentPath, depth) {
      if (depth > config.maxDepth) {
        warnings.push({ code: "MAX_DEPTH_REACHED", depth: config.maxDepth });
        return;
      }

      const entries = await fsp.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (fileCount >= config.maxFiles) {
          warnings.push({ code: "MAX_FILES_REACHED", maxFiles: config.maxFiles });
          return;
        }

        const fullPath = path.join(currentPath, entry.name);
        const lst = await fsp.lstat(fullPath);

        if (lst.isSymbolicLink()) {
          warnings.push({ code: "SYMLINK_SKIPPED", name: entry.name });
          continue;
        }

        const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          const isSet = entry.name.toLowerCase().endsWith(".set");
          files.push({
            name: entry.name,
            relativePath,
            extension: isSet ? ".set" : "",
            kind: "directory",
            classification: isSet ? "korg_set_container" : "directory",
            implementationStatus: isSet ? "partial_indexing_only" : "supported"
          });
          await walk(fullPath, depth + 1);
          continue;
        }

        if (!entry.isFile()) continue;

        if (lst.size > config.maxSingleFileBytes) {
          warnings.push({
            code: "FILE_TOO_LARGE",
            name: entry.name,
            maxSingleFileBytes: config.maxSingleFileBytes
          });
          continue;
        }

        if (totalBytes + lst.size > config.maxTotalBytes) {
          warnings.push({
            code: "MAX_TOTAL_BYTES_REACHED",
            maxTotalBytes: config.maxTotalBytes
          });
          return;
        }

        const extension = path.extname(entry.name).toLowerCase();
        const classification = classifySetResource(extension);

        files.push({
          name: entry.name,
          relativePath,
          extension,
          kind: "file",
          size: lst.size,
          modifiedAt: lst.mtime.toISOString(),
          checksum: await sha256File(fullPath),
          classification,
          implementationStatus:
            classification === "unsupported"
              ? "unsupported"
              : "metadata_indexing_only"
        });

        fileCount += 1;
        totalBytes += lst.size;
      }
    }

    await walk(rootPath, 0);

    return {
      rootName: path.basename(rootPath),
      implementationStatus: "partial_indexing_only",
      proprietaryParsing: "unsupported",
      fileCount,
      totalBytes,
      files,
      warnings
    };
  }

  return { scan };
}

module.exports = {
  createSetScanner,
  assertAllowedPath,
  classifySetResource,
  isWithinRoot
};
