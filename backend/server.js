const fs = require("fs");
const path = require("path");
const express = require("express");
const { createUmsRouter } = require("./umsRoutes.cjs");
const { createSetHardwareApiRouter } = require("./routes/setHardwareApi");
const { createAudioArrangementApiRouter } = require("./routes/audioArrangementApi");
const { createAudioArrangementMidiApiRouter } = require("./routes/audioArrangementMidiApi");
const app = express();
const port = Number(process.env.PORT || 5199);
const version = "11.2.0-local";
const productName = "Keyboard Manager";
const backendRoot = __dirname;
const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(backendRoot, "data");
const uploadsDir = path.join(backendRoot, "uploads");
const samplesDir = path.join(repoRoot, "samples");
const frontendDist = path.join(repoRoot, "uaos-live-clean", "dist");
const frontendIndexFile = path.join(frontendDist, "index.html");
const hiddenLibraryFile = path.join(dataDir, "library-hidden.json");
const sampleMapFile = path.join(dataDir, "sample-map.json");
const projectsFile = path.join(dataDir, "projects.json");
const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5180",
  "http://localhost:5180",
  "http://127.0.0.1:5199",
  "http://localhost:5199"
]);
const supportedExtensions = new Set([
  ".mid",
  ".midi",
  ".syx",
  ".sty",
  ".set",
  ".pcg",
  ".kst",
  ".pad",
  ".prs",
  ".all",
  ".bkp",
  ".pkg"
]);
const arrangerExtensions = new Set([
  ".sty",
  ".set",
  ".pcg",
  ".kst",
  ".pad",
  ".prs",
  ".all",
  ".bkp",
  ".pkg"
]);
const chords = {
  C: [60, 64, 67],
  Cm: [60, 63, 67],
  Dm: [62, 65, 69],
  G7: [67, 71, 74, 77],
  F: [65, 69, 72],
  Bb: [70, 74, 77],
  Am: [69, 72, 76]
};

const serviceBlueprints = [
  {
    id: "backend",
    name: "Local Backend API",
    directory: "backend",
    startCommand: "cd backend && npm start",
    port,
    healthEndpoint: "/health",
    consumer: "uaos-live-clean/src/lib/uaosApiClient.js"
  },
  {
    id: "frontend-dev",
    name: "Frontend Dev Server",
    directory: "uaos-live-clean",
    startCommand: "cd uaos-live-clean && npm run dev",
    port: 5173,
    healthEndpoint: "/",
    consumer: "desktop/main.cjs"
  },
  {
    id: "frontend-preview",
    name: "Frontend Preview Server",
    directory: "uaos-live-clean",
    startCommand: "cd uaos-live-clean && npm run preview",
    port: 5180,
    healthEndpoint: "/",
    consumer: "desktop/main.cjs"
  },
  {
    id: "desktop-bridge",
    name: "Electron Desktop Bridge",
    directory: "desktop",
    startCommand: "cd desktop && npm start",
    port: null,
    healthEndpoint: "ipc:uaos-midi-test",
    consumer: "uaos-live-clean/src/components/MidiMonitor.jsx"
  },
  {
    id: "runtime-orchestrator",
    name: "Local Runtime Orchestrator",
    directory: "orchestrator",
    startCommand: "node orchestrator/RuntimeOrchestrator.cjs",
    port: null,
    healthEndpoint: "runtime:status",
    consumer: "scripts/UAOS_RUNTIME_START.ps1"
  },
  {
    id: "v2-runtime",
    name: "V2 Runtime Bootstrap",
    directory: "v2-runtime",
    startCommand: "cd v2-runtime && npm start",
    port: null,
    healthEndpoint: "process:stdout",
    consumer: "scripts/UAOS_RUNTIME_START.ps1"
  }
];

let serviceCache = new Map();

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(samplesDir, { recursive: true });
app.use(express.json({ limit: "25mb" }));
app.use("/api/ums", createUmsRouter(express, { dataDir }));
app.use("/api", createSetHardwareApiRouter(express, {
  allowedRoots: [
    process.env.UAOS_SCAN_ROOT,
    path.join(repoRoot, "storage", "user_sets"),
    path.join(repoRoot, "samples")
  ].filter(Boolean)
}));
app.use("/api", createAudioArrangementApiRouter(express));
app.use("/api", createAudioArrangementMidiApiRouter(express));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-UAOS-CSRF");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "25mb" }));
app.use("/samples", express.static(uploadsDir));
app.use(express.static(frontendDist));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function ensureJsonFile(file, fallback) {
  if (!fs.existsSync(file)) {
    writeJson(file, fallback);
  }
}

function normalizePathSegments(input) {
  return String(input || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function isWithinRoot(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  return (
    resolvedTarget === resolvedRoot ||
    resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  );
}

function safeName(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "file";
}

function normalizeProjectId(value) {
  const id = typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
  if (!id) return "";
  if (/[\0\r\n\\/]/.test(id)) return "";
  return id.slice(0, 96);
}

function sanitizeProjectName(value, fallback = "Untitled Project") {
  const name = ((typeof value === "string" || typeof value === "number")
    ? String(value)
    : "")
    .replace(/[\0\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name.slice(0, 120) || fallback;
}

function sanitizeProjectDescription(value) {
  return (typeof value === "string" || typeof value === "number" ? String(value) : "")
    .replace(/[\0\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function sanitizeProjectTimeline(value) {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function sanitizeProjectSession(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return { ...value };
}

function sanitizeProjectMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

function sanitizeProjectRecord(body = {}, overrides = {}) {
  const nextId = normalizeProjectId(overrides.id ?? body.id) || `${Date.now()}`;
  const createdAt = String(overrides.createdAt ?? body.createdAt ?? new Date().toISOString());

  return {
    id: nextId,
    name: sanitizeProjectName(overrides.name ?? body.name ?? body.title),
    description: sanitizeProjectDescription(overrides.description ?? body.description),
    createdAt,
    updatedAt: new Date().toISOString(),
    timeline: sanitizeProjectTimeline(overrides.timeline ?? body.timeline),
    session: sanitizeProjectSession(overrides.session ?? body.session),
    metadata: sanitizeProjectMetadata(overrides.metadata ?? body.metadata)
  };
}

function unique(values) {
  return [...new Set(values)];
}

function extractStrings(buffer) {
  const text = buffer.toString("latin1").replace(/[^\x20-\x7e]+/g, "\n");
  return unique(
    text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length >= 4)
  );
}

function detectBrand(text) {
  const haystack = String(text || "").toLowerCase();
  if (
    haystack.includes("korg") ||
    haystack.includes(".set") ||
    haystack.includes("pa80") ||
    haystack.includes("pa1x") ||
    haystack.includes("pa4x")
  ) {
    return "Korg";
  }
  if (haystack.includes("yamaha") || haystack.includes("tyros") || haystack.includes("psr")) {
    return "Yamaha";
  }
  if (haystack.includes("roland")) return "Roland";
  if (haystack.includes("ketron")) return "Ketron";
  return "unknown";
}

function readVarLen(buffer, start, end) {
  let value = 0;
  let cursor = start;
  for (let i = 0; i < 4 && cursor < end; i += 1) {
    const byte = buffer[cursor++];
    value = (value << 7) + (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return { value, next: cursor };
}

function parseMidi(buffer) {
  if (buffer.length < 14 || buffer.subarray(0, 4).toString("ascii") !== "MThd") {
    throw new Error("Missing MThd header.");
  }

  const headerLength = buffer.readUInt32BE(4);
  const format = buffer.readUInt16BE(8);
  const trackCount = buffer.readUInt16BE(10);
  const divisionRaw = buffer.readUInt16BE(12);

  let offset = 8 + headerLength;
  let notes = 0;
  let controllers = 0;
  let programChanges = 0;
  let tempoEvents = 0;
  let sysexEvents = 0;

  for (let track = 0; track < trackCount && offset + 8 <= buffer.length; track += 1) {
    if (buffer.subarray(offset, offset + 4).toString("ascii") !== "MTrk") break;

    const length = buffer.readUInt32BE(offset + 4);
    const end = Math.min(buffer.length, offset + 8 + length);
    let cursor = offset + 8;
    let runningStatus = null;

    while (cursor < end) {
      const delta = readVarLen(buffer, cursor, end);
      cursor = delta.next;

      let status = buffer[cursor++];
      if (status < 0x80) {
        cursor -= 1;
        status = runningStatus;
      } else if (status < 0xf0) {
        runningStatus = status;
      }

      if (status === 0xff) {
        const type = buffer[cursor++];
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        if (type === 0x51) tempoEvents += 1;
      } else if (status === 0xf0 || status === 0xf7) {
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        sysexEvents += 1;
      } else if (status >= 0x80 && status <= 0xef) {
        const event = status & 0xf0;
        const size = event === 0xc0 || event === 0xd0 ? 1 : 2;
        if (event === 0x90 && buffer[cursor + 1] > 0) notes += 1;
        if (event === 0xb0) controllers += 1;
        if (event === 0xc0) programChanges += 1;
        cursor += size;
      } else {
        break;
      }
    }

    offset = end;
  }

  return {
    validHeader: true,
    headerLength,
    format,
    trackCount,
    division: divisionRaw,
    ppq: divisionRaw < 0x8000 ? divisionRaw : null,
    notes,
    controllers,
    programChanges,
    tempoEvents,
    sysexEvents
  };
}

function parseSysex(buffer) {
  const blocks = [];

  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] !== 0xf0 && buffer[i] !== 0xf7) continue;
    const start = i;
    let end = i + 1;
    while (end < buffer.length && buffer[end] !== 0xf7) end += 1;
    if (end < buffer.length) end += 1;

    blocks.push({
      start,
      length: end - start,
      startsWith: `0x${buffer[start].toString(16).padStart(2, "0")}`,
      manufacturerByte: buffer[start + 1] === undefined
        ? null
        : `0x${buffer[start + 1].toString(16).padStart(2, "0")}`
    });

    i = end;
  }

  return {
    hasF0: buffer.includes(0xf0),
    hasF7: buffer.includes(0xf7),
    blockCount: blocks.length,
    manufacturerByte: blocks[0]?.manufacturerByte || null,
    blocks: blocks.slice(0, 50),
    rawHexPreview: buffer.subarray(0, 256).toString("hex").match(/.{1,2}/g)?.join(" ") || ""
  };
}

function inspectBinary(buffer, size) {
  let printable = 0;
  let zeroBytes = 0;

  for (const byte of buffer) {
    if (byte >= 32 && byte <= 126) printable += 1;
    if (byte === 0) zeroBytes += 1;
  }

  return {
    inspectedBytes: buffer.length,
    totalBytes: size,
    asciiRatio: buffer.length ? Number((printable / buffer.length).toFixed(3)) : 0,
    zeroByteRatio: buffer.length ? Number((zeroBytes / buffer.length).toFixed(3)) : 0
  };
}

function baseResult(filePath, rootDir, data) {
  const analysis = {
    id: path.relative(rootDir, filePath).replaceAll(path.sep, "/"),
    name: path.basename(filePath),
    path: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
    analyzedAt: new Date().toISOString(),
    ...data
  };

  analysis.korg = analysis.korg || {};
  analysis.korg.pad = analysis.korg.pad || {};
  analysis.korg.pad.folderPresent = detectKorgPadFolderPresence([
    analysis,
    analysis.children,
    analysis.files,
    analysis.entries,
    analysis.paths,
    analysis.archiveEntries,
    analysis.detectedFiles,
    analysis.metadata
  ]);

  return analysis;
}

function detectKorgPadFolderPresence(input) {
  const values = [];

  function collect(value) {
    if (!value) return;

    if (typeof value === "string") {
      values.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) collect(item);
      return;
    }

    if (typeof value === "object") {
      for (const key of ["path", "name", "filename", "originalname", "relativePath"]) {
        if (value[key]) values.push(String(value[key]));
      }

      for (const key of Object.keys(value)) {
        if (key.toLowerCase().includes("pad")) values.push(key);
      }
    }
  }

  collect(input);

  return values
    .map((value) => String(value).replace(/\\/g, "/").toUpperCase())
    .some((value) =>
      value === "PAD" ||
      value.endsWith("/PAD") ||
      value.includes("/PAD/") ||
      value.includes(".PAD") ||
      value.endsWith("/PAD/")
    );
}

async function analyzeFile(filePath, rootDir, options = {}) {
  const stat = await fs.promises.stat(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const maxRead = options.lightweight ? 256 * 1024 : 2 * 1024 * 1024;
  const handle = await fs.promises.open(filePath, "r");
  const buffer = Buffer.alloc(Math.min(stat.size, maxRead));

  try {
    await handle.read(buffer, 0, buffer.length, 0);
  } finally {
    await handle.close();
  }

  const common = {
    kind: "file",
    extension,
    size: stat.size,
    supported: supportedExtensions.has(extension),
    hexPreview: buffer.subarray(0, 128).toString("hex").match(/.{1,2}/g)?.join(" ") || "",
    strings: extractStrings(buffer).slice(0, options.lightweight ? 20 : 120)
  };

  try {
    if (extension === ".mid" || extension === ".midi" || buffer.subarray(0, 4).toString("ascii") === "MThd") {
      return baseResult(filePath, rootDir, { ...common, parser: "midi", midi: parseMidi(buffer) });
    }

    if (extension === ".syx") {
      return baseResult(filePath, rootDir, { ...common, parser: "sysex", sysex: parseSysex(buffer) });
    }

    if (arrangerExtensions.has(extension) || !supportedExtensions.has(extension)) {
      return baseResult(filePath, rootDir, {
        ...common,
        parser: "arranger-safe-inspector",
        possibleBrand: detectBrand(`${filePath}\n${common.strings.join("\n")}`),
        proprietary: arrangerExtensions.has(extension),
        deepParserNeeded: arrangerExtensions.has(extension),
        metadata: inspectBinary(buffer, stat.size)
      });
    }

    return baseResult(filePath, rootDir, {
      ...common,
      parser: "binary-safe-inspector",
      metadata: inspectBinary(buffer, stat.size)
    });
  } catch (error) {
    return baseResult(filePath, rootDir, {
      ...common,
      parser: "error-safe-inspector",
      warning: error.message
    });
  }
}

async function analyzeDirectory(targetPath, rootDir) {
  const files = await walk(targetPath);
  const summaries = [];
  const extCounts = {};
  let totalSize = 0;

  for (const filePath of files) {
    const stat = await fs.promises.stat(filePath);
    totalSize += stat.size;
    const ext = path.extname(filePath).toLowerCase() || "[none]";
    extCounts[ext] = (extCounts[ext] || 0) + 1;
    if (summaries.length < 60) {
      summaries.push(await analyzeFile(filePath, rootDir, { lightweight: true }));
    }
  }

  const strings = unique(summaries.flatMap((item) => item.strings || [])).slice(0, 80);

  return baseResult(targetPath, rootDir, {
    kind: "directory",
    extension: path.extname(targetPath).toLowerCase(),
    size: totalSize,
    fileCount: files.length,
    possibleBrand: detectBrand(`${targetPath}\n${strings.join("\n")}`),
    proprietary: true,
    deepParserNeeded: true,
    message: "Directory-based arranger set inspected safely. Proprietary subformats are summarized without decoding musical or sample content.",
    extensionCounts: extCounts,
    strings,
    children: summaries
  });
}

async function analyzePath(targetPath, options = {}) {
  const stat = await fs.promises.stat(targetPath);
  const rootDir = options.rootDir || path.dirname(targetPath);
  if (stat.isDirectory()) return analyzeDirectory(targetPath, rootDir);
  return analyzeFile(targetPath, rootDir, options);
}

async function walk(dir) {
  const out = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(fullPath));
    if (entry.isFile()) out.push(fullPath);
  }
  return out;
}

async function collectLibraryEntries(rootDir) {
  const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".set") {
        out.push(fullPath);
        continue;
      }

      out.push(...await collectLibraryEntries(fullPath));
      continue;
    }

    if (entry.isFile()) {
      out.push(fullPath);
    }
  }

  return out;
}

function resolveLibraryTarget(id) {
  const normalized = normalizePathSegments(id);
  if (!normalized) {
    throw new Error("Missing library id.");
  }

  if (normalized.startsWith("uploads/")) {
    const target = path.resolve(uploadsDir, normalized.slice("uploads/".length));
    if (isWithinRoot(target, uploadsDir)) return { rootDir: uploadsDir, target };
  }

  const sampleTarget = path.resolve(samplesDir, normalized);
  if (isWithinRoot(sampleTarget, samplesDir)) {
    return { rootDir: samplesDir, target: sampleTarget };
  }

  const uploadTarget = path.resolve(uploadsDir, normalized);
  if (isWithinRoot(uploadTarget, uploadsDir)) {
    return { rootDir: uploadsDir, target: uploadTarget };
  }

  throw new Error("Invalid library id.");
}

function loadHiddenLibraryIds() {
  const hidden = readJson(hiddenLibraryFile, []);
  return new Set(Array.isArray(hidden) ? hidden.map((item) => String(item)) : []);
}

function saveHiddenLibraryIds(hidden) {
  writeJson(hiddenLibraryFile, [...hidden].sort());
}

async function buildLibraryList() {
  const hidden = loadHiddenLibraryIds();
  const targets = [];
  if (fs.existsSync(samplesDir)) targets.push(...await collectLibraryEntries(samplesDir));
  if (fs.existsSync(uploadsDir)) targets.push(...await collectLibraryEntries(uploadsDir));

  const uniqueTargets = unique(targets.map((item) => path.resolve(item)));
  const analyses = [];

  for (const target of uniqueTargets) {
    const relSamples = isWithinRoot(target, samplesDir)
      ? normalizePathSegments(path.relative(samplesDir, target))
      : "";
    const relUploads = isWithinRoot(target, uploadsDir)
      ? `uploads/${normalizePathSegments(path.relative(uploadsDir, target))}`
      : "";
    const id = relSamples || relUploads;
    if (!id || hidden.has(id)) continue;
    analyses.push(await analyzePath(target, { rootDir: isWithinRoot(target, samplesDir) ? samplesDir : uploadsDir, lightweight: true }));
  }

  analyses.sort((left, right) => left.name.localeCompare(right.name));
  return analyses;
}

function summaryFromAnalysis(analysis) {
  const summary = {
    id: analysis.id,
    name: analysis.name,
    path: analysis.path,
    kind: analysis.kind,
    extension: analysis.extension,
    size: analysis.size,
    parser: analysis.parser,
    supported: analysis.supported,
    possibleBrand: analysis.possibleBrand || "unknown",
    deepParserNeeded: Boolean(analysis.deepParserNeeded),
    proprietary: Boolean(analysis.proprietary),
    fileCount: analysis.fileCount || 0,
    stringCount: Array.isArray(analysis.strings) ? analysis.strings.length : 0
  };

  if (analysis.kind === "directory") {
    summary.children = Array.isArray(analysis.children) ? analysis.children.length : 0;
  }

  return summary;
}

function readProjects() {
  ensureJsonFile(projectsFile, []);
  const projects = readJson(projectsFile, []);
  return Array.isArray(projects) ? projects : [];
}

function writeProjects(projects) {
  writeJson(projectsFile, projects);
}

function createProjectRecord(body) {
  return sanitizeProjectRecord(body);
}

function upsertProject(projects, project) {
  const index = projects.findIndex((item) => item.id === project.id);
  if (index >= 0) {
    projects[index] = { ...projects[index], ...project, updatedAt: new Date().toISOString() };
    return projects[index];
  }

  projects.unshift(project);
  return project;
}

function ensureSampleSeed() {
  ensureJsonFile(sampleMapFile, []);
  ensureJsonFile(projectsFile, []);
  ensureJsonFile(hiddenLibraryFile, []);
}

async function probeHttpService(service) {
  if (!service.probeUrl) {
    return {
      status: service.staticStatus || "unavailable",
      detail: service.staticDetail || "No HTTP health endpoint is configured."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(service.probeUrl, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    });

    const text = await response.text().catch(() => "");
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    return {
      status: response.ok ? "online" : "degraded",
      detail: response.ok
        ? (payload?.service || payload?.app || response.statusText || "online")
        : `HTTP ${response.status}`,
      payload
    };
  } catch (error) {
    return {
      status: "offline",
      detail: error.name === "AbortError" ? "Health probe timed out." : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshServiceCache() {
  const updates = await Promise.all(
    serviceBlueprints.map(async (service) => {
      if (service.id === "backend") {
        return [service.id, {
          status: "online",
          detail: "Backend process is running.",
          checkedAt: new Date().toISOString()
        }];
      }

      if (service.id === "desktop-bridge") {
        return [service.id, {
          status: process.versions.electron ? "online" : "unavailable",
          detail: process.versions.electron
            ? "Electron context detected."
            : "Electron bridge is only available inside the desktop shell.",
          checkedAt: new Date().toISOString()
        }];
      }

      if (service.id === "runtime-orchestrator") {
        return [service.id, {
          status: "reference-only",
          detail: "Runtime orchestrator exists as a local bootstrap class, not a network service.",
          checkedAt: new Date().toISOString()
        }];
      }

      if (service.id === "v2-runtime") {
        return [service.id, {
          status: "reference-only",
          detail: "V2 runtime bootstrap is present for offline development and future integration.",
          checkedAt: new Date().toISOString()
        }];
      }

      const probeUrl = `http://127.0.0.1:${service.port}${service.healthEndpoint}`;
      const result = await probeHttpService({ ...service, probeUrl });
      return [service.id, {
        status: result.status,
        detail: result.detail,
        checkedAt: new Date().toISOString(),
        payload: result.payload || null
      }];
    })
  );

  serviceCache = new Map(updates);
  return serviceCache;
}

function getServiceReport() {
  return serviceBlueprints.map((service) => {
    const health = serviceCache.get(service.id) || {
      status: "unknown",
      detail: "Health not checked yet.",
      checkedAt: null
    };

    return {
      ...service,
      status: health.status,
      detail: health.detail,
      checkedAt: health.checkedAt
    };
  });
}

function toMidi(pattern) {
  const tempo = Number(pattern?.tempo || 120);
  const mpqn = Math.round(60000000 / Math.max(1, tempo));
  const events = [
    Buffer.from([0, 0xff, 0x51, 3, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255])
  ];
  const flat = [];

  for (const note of pattern?.notes || []) {
    flat.push({
      time: note.time,
      on: true,
      note: note.note,
      velocity: note.velocity || 100,
      channel: note.channel || 0
    });
    flat.push({
      time: note.time + note.duration,
      on: false,
      note: note.note,
      velocity: 0,
      channel: note.channel || 0
    });
  }

  flat.sort((a, b) => a.time - b.time || Number(a.on) - Number(b.on));
  let last = 0;

  for (const event of flat) {
    const delta = Math.max(0, event.time - last);
    events.push(midiEvent(delta, [
      event.on ? 0x90 + event.channel : 0x80 + event.channel,
      event.note,
      event.velocity
    ]));
    last = event.time;
  }

  events.push(Buffer.from([0, 0xff, 0x2f, 0]));

  const body = Buffer.concat(events);
  const header = Buffer.alloc(14);
  header.write("MThd");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(1, 10);
  header.writeUInt16BE(480, 12);

  const track = Buffer.alloc(8);
  track.write("MTrk");
  track.writeUInt32BE(body.length, 4);

  return Buffer.concat([header, track, body]);
}

function vlq(value) {
  const bytes = [value & 0x7f];
  let remaining = value >> 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>= 7;
  }
  return Buffer.from(bytes);
}

function midiEvent(delta, data) {
  return Buffer.concat([vlq(delta), Buffer.from(data)]);
}

function makePattern(body = {}) {
  const tempo = Math.max(30, Math.min(260, Number(body.tempo || 96)));
  const chord = chords[body.chord] ? body.chord : "Cm";
  const maqam = String(body.maqam || "Nahawand");
  const structure = Array.isArray(body.structure) && body.structure.length
    ? body.structure
    : [body.section || "VAR_A"];
  const base = chords[chord];
  const notes = [];
  let position = 0;

  for (const section of structure) {
    for (let step = 0; step < 4; step += 1) {
      notes.push({
        time: position + step * 480,
        duration: 360,
        note: base[step % base.length],
        velocity: 96 - (step % 3) * 6,
        channel: 0,
        role: "melody",
        section
      });
      notes.push({
        time: position + step * 480 + 240,
        duration: 150,
        note: base[0] - 12,
        velocity: 75,
        channel: 1,
        role: "bass",
        section
      });
      notes.push({
        time: position + step * 480,
        duration: 90,
        note: step % 2 ? 42 : 36,
        velocity: step % 2 ? 80 : 112,
        channel: 9,
        role: "drum",
        section
      });
    }

    if (section === "FILL_1" || section === "FILL_2") {
      [38, 40, 43, 45].forEach((note, index) => {
        notes.push({
          time: position + 1440 + index * 90,
          duration: 70,
          note,
          velocity: 112,
          channel: 9,
          role: "fill",
          section
        });
      });
    }

    position += 1920;
  }

  return {
    ok: true,
    generator: "deterministic-v1-pattern",
    name: `UAOS ${structure[0]} ${chord} ${maqam}`,
    tempo,
    section: structure[0],
    chord,
    maqam,
    structure,
    timeline: Array.isArray(body.timeline) ? body.timeline : [],
    ppq: 480,
    notes
  };
}

function resolveUploadFilename(body) {
  const name = safeName(body?.filename || body?.name || "upload.bin");
  return `${Date.now()}-${name}`;
}

function parseUploadBody(body) {
  if (body?.base64 || body?.contentBase64) {
    return Buffer.from(String(body.base64 || body.contentBase64), "base64");
  }

  if (typeof body?.content === "string") {
    return Buffer.from(body.content, "utf8");
  }

  return null;
}

async function storeUpload(body) {
  const filename = resolveUploadFilename(body);
  const data = parseUploadBody(body);
  if (!data || !data.length) {
    throw new Error("Upload body must include base64 or text content.");
  }

  const target = path.join(uploadsDir, filename);
  await fs.promises.writeFile(target, data);
  return target;
}

function readProjectById(id) {
  const projectId = normalizeProjectId(id);
  if (!projectId) return null;
  return readProjects().find((project) => project.id === projectId) || null;
}

function writeProjectList(nextProjects) {
  writeProjects(nextProjects);
}

function removeProjectById(id) {
  const projectId = normalizeProjectId(id);
  if (!projectId) return null;
  const projects = readProjects();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index < 0) return null;
  const [removed] = projects.splice(index, 1);
  writeProjectList(projects);
  return removed;
}

function duplicateProjectById(id) {
  const projectId = normalizeProjectId(id);
  if (!projectId) return null;
  const projects = readProjects();
  const source = projects.find((project) => project.id === projectId);
  if (!source) return null;
  const duplicateId = normalizeProjectId(`${source.id}-copy-${Date.now()}`) || `copy-${Date.now()}`;
  const copy = {
    ...source,
    id: duplicateId,
    name: sanitizeProjectName(`${source.name} Copy`, "Project Copy"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.unshift(copy);
  writeProjectList(projects);
  return copy;
}

function renameProjectById(id, name) {
  const projectId = normalizeProjectId(id);
  if (!projectId) return null;
  const projects = readProjects();
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;
  project.name = sanitizeProjectName(name, project.name);
  project.updatedAt = new Date().toISOString();
  writeProjectList(projects);
  return project;
}

function summarizeCounts() {
  const projects = readProjects();
  const sampleMap = readJson(sampleMapFile, []);
  const uploads = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0;
  return {
    projects: projects.length,
    samplerMappings: Array.isArray(sampleMap) ? sampleMap.length : 0,
    uploads
  };
}

ensureSampleSeed();
refreshServiceCache().catch((error) => {
  console.error("Initial service health refresh failed", error);
});
const serviceRefreshTimer = setInterval(() => {
  refreshServiceCache().catch((error) => {
    console.error("Service health refresh failed", error);
  });
}, 15000);
if (typeof serviceRefreshTimer.unref === "function") {
  serviceRefreshTimer.unref();
}

app.get("/health", (_req, res) => res.json({
  ok: true,
  service: "uaos-local-backend",
  product: productName,
  mode: process.env.NODE_ENV || "development",
  time: new Date().toISOString()
}));

app.get("/", (_req, res) => {
  if (fs.existsSync(frontendIndexFile)) {
    return res.sendFile(frontendIndexFile);
  }

  return res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${productName}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; background: #0b1020; color: #edf2ff; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 2rem; box-sizing: border-box; }
      section { max-width: 48rem; width: 100%; border: 1px solid rgba(255,255,255,.14); border-radius: 20px; padding: 2rem; background: rgba(11,16,32,.92); box-shadow: 0 20px 80px rgba(0,0,0,.35); }
      a { color: #89b4ff; }
      code { background: rgba(255,255,255,.08); padding: 0.15rem 0.35rem; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${productName}</h1>
        <p>Local runtime is online. The built frontend is not available yet, but the backend is responding and the API is ready.</p>
        <ul>
          <li><a href="/health">/health</a></li>
          <li><a href="/api/status">/api/status</a></li>
          <li><a href="/api/library">/api/library</a></li>
        </ul>
        <p>Frontend build path: <code>${frontendIndexFile.replaceAll("\\", "\\\\")}</code></p>
      </section>
    </main>
  </body>
</html>`);
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "uaos-local-backend",
    product: productName,
    health: getServiceReport().map(({ id, name, status, detail, checkedAt }) => ({
      id,
      name,
      status,
      detail,
      checkedAt
    }))
  });
});

app.get("/api/version", (_req, res) => res.json({ ok: true, version, api: "uaos-local" }));

app.get("/api/status", (_req, res) => {
  const services = getServiceReport();
  res.json({
    ok: true,
    product: productName,
    version,
    mode: process.env.NODE_ENV || "development",
    port,
    counts: summarizeCounts(),
    features: {
      sampler: "available",
      webMidi: "browser",
      timeline: "available",
      midiExport: "available",
      ai: "offline-first",
      arranger: "available",
      library: "available",
      projects: "available"
    },
    discoveredServices: services,
    services
  });
});

app.get("/api/services", (_req, res) => {
  res.json({
    ok: true,
    services: getServiceReport()
  });
});

app.get("/api/presets", (_req, res) => res.json([
  { name: "Khaliji Pop 96", tempo: 96, maqam: "Nahawand", section: "VAR_A", chord: "Cm" },
  { name: "Oriental Ballad 76", tempo: 76, maqam: "Bayati", section: "VAR_B", chord: "Dm" },
  { name: "Hijaz Dance 112", tempo: 112, maqam: "Hijaz", section: "FILL_1", chord: "G7" }
]));

app.post("/api/pattern-generate", (req, res) => res.json(makePattern(req.body || {})));

app.post("/api/midi-export", (req, res) => {
  const file = toMidi(makePattern(req.body || {}));
  res.setHeader("Content-Type", "audio/midi");
  res.setHeader("Content-Disposition", "attachment; filename=uaos-pattern.mid");
  res.send(file);
});

app.post("/api/upload", async (req, res) => {
  try {
    const sourcePath = String(req.body?.sourcePath || req.body?.path || "").trim();
    let targetPath = "";

    if (sourcePath) {
      const resolved = path.resolve(repoRoot, sourcePath);
      if (!isWithinRoot(resolved, samplesDir) && !isWithinRoot(resolved, uploadsDir)) {
        return res.status(400).json({ ok: false, error: "Upload source must stay within samples or uploads." });
      }
      targetPath = resolved;
    } else {
      targetPath = await storeUpload(req.body || {});
    }

    const analysis = await analyzePath(targetPath, {
      rootDir: isWithinRoot(targetPath, samplesDir) ? samplesDir : uploadsDir
    });

    res.status(201).json({
      ok: true,
      stored: path.relative(repoRoot, targetPath).replaceAll(path.sep, "/"),
      analysis
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/library", async (_req, res) => {
  try {
    const items = await buildLibraryList();
    res.json({
      ok: true,
      count: items.length,
      items: items.map(summaryFromAnalysis)
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Could not read library.", detail: error.message });
  }
});

app.get("/api/library/:id", async (req, res) => {
  try {
    const { rootDir, target } = resolveLibraryTarget(req.params.id);
    await fs.promises.stat(target);
    res.json(await analyzePath(target, { rootDir }));
  } catch (error) {
    res.status(404).json({ ok: false, error: "Library item not found.", detail: error.message });
  }
});

app.get("/api/export/:id", async (req, res) => {
  try {
    const { rootDir, target } = resolveLibraryTarget(req.params.id);
    const analysis = await analyzePath(target, { rootDir });
    res.setHeader("Content-Disposition", `attachment; filename="${safeName(req.params.id)}.json"`);
    res.json(analysis);
  } catch (error) {
    res.status(404).json({ ok: false, error: "Export failed.", detail: error.message });
  }
});

app.delete("/api/library/:id", async (req, res) => {
  try {
    const { rootDir, target } = resolveLibraryTarget(req.params.id);
    if (isWithinRoot(target, samplesDir)) {
      return res.status(403).json({
        ok: false,
        error: "Protected sample content is never deleted.",
        detail: "The endpoint only hides uploaded items from the active library index."
      });
    }

    if (!isWithinRoot(target, uploadsDir)) {
      return res.status(400).json({ ok: false, error: "Only uploaded items can be hidden." });
    }

    const hidden = loadHiddenLibraryIds();
    const relative = normalizePathSegments(path.relative(rootDir, target));
    hidden.add(rootDir === uploadsDir ? `uploads/${relative}` : relative);
    saveHiddenLibraryIds(hidden);

    res.json({
      ok: true,
      deleted: req.params.id,
      action: "hidden",
      note: "The file was not removed from disk."
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: "Delete failed.", detail: error.message });
  }
});

app.get("/api/sampler/map", (_req, res) => res.json(readJson(sampleMapFile, [])));

app.post("/api/sampler/map", (req, res) => {
  const map = Array.isArray(req.body) ? req.body : [];
  writeJson(sampleMapFile, map);
  res.json({ ok: true, count: map.length });
});

app.post("/api/samples/import", (req, res) => {
  try {
    const filename = safeName(req.body?.filename || "sample.wav");
    const target = path.join(uploadsDir, `${Date.now()}-${filename}`);
    fs.writeFileSync(target, Buffer.from(req.body?.base64 || "", "base64"));
    res.json({ ok: true, file: path.basename(target), url: `/samples/${path.basename(target)}` });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/project/save", (req, res) => {
  const projects = readProjects();
  const project = createProjectRecord(req.body || {});
  const saved = upsertProject(projects, project);
  writeProjectList(projects);
  res.json({ ok: true, project: saved });
});

app.get("/api/project/list", (_req, res) => res.json(readProjects()));

app.get("/api/project/:id", (req, res) => {
  const project = readProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ ok: false, error: "Project not found." });
  }
  return res.json({ ok: true, project });
});

app.put("/api/project/:id", (req, res) => {
  const projects = readProjects();
  const projectId = normalizeProjectId(req.params.id);
  const project = projectId ? projects.find((item) => item.id === projectId) : null;
  if (!project) {
    return res.status(404).json({ ok: false, error: "Project not found." });
  }

  if (typeof req.body?.name === "string") {
    project.name = sanitizeProjectName(req.body.name, project.name);
  }

  if (Array.isArray(req.body?.timeline)) {
    project.timeline = sanitizeProjectTimeline(req.body.timeline);
  }

  if (req.body?.session !== undefined) {
    project.session = sanitizeProjectSession(req.body.session);
  }

  if (req.body?.description !== undefined) {
    project.description = sanitizeProjectDescription(req.body.description);
  }

  if (req.body?.metadata !== undefined) {
    project.metadata = sanitizeProjectMetadata(req.body.metadata);
  }

  project.updatedAt = new Date().toISOString();
  writeProjectList(projects);
  res.json({ ok: true, project });
});

app.post("/api/project/:id/duplicate", (req, res) => {
  const duplicate = duplicateProjectById(req.params.id);
  if (!duplicate) {
    return res.status(404).json({ ok: false, error: "Project not found." });
  }
  return res.status(201).json({ ok: true, project: duplicate });
});

app.post("/api/project/:id/rename", (req, res) => {
  const renamed = renameProjectById(req.params.id, req.body?.name);
  if (!renamed) {
    return res.status(404).json({ ok: false, error: "Project not found." });
  }
  return res.json({ ok: true, project: renamed });
});

app.delete("/api/project/:id", (req, res) => {
  const confirmed = req.body?.confirmed === true || String(req.query.confirmed || "").toLowerCase() === "true";
  if (!confirmed) {
    return res.status(409).json({
      ok: false,
      error: "Delete confirmation required.",
      detail: "Send confirmed=true to delete a project record."
    });
  }

  const removed = removeProjectById(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: "Project not found." });
  }

  return res.json({ ok: true, project: removed });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Unknown endpoint: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

if (require.main === module) {
app.listen(port, () => {
    console.log(`UAOS local backend listening on http://127.0.0.1:${port}`);
  });
}

module.exports = {
  app,
  analyzePath,
  buildServiceReport: getServiceReport,
  createProjectRecord,
  duplicateProjectById,
  makePattern,
  normalizeProjectId,
  renameProjectById,
  removeProjectById,
  sanitizeProjectName,
  sanitizeProjectRecord,
  toMidi,
  refreshServiceCache
};
