/**
 * Lightweight local Owner Listening UI server.
 * Serves the listening pack, verifies hashes, records an explicit owner
 * decision. Never auto-PASS. Never writes WAV files. Not a Program Tree controller.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PACK_DIR = path.join(ROOT, "docs", "owner-listening-pack");
export const CATALOG_PATH = path.join(PACK_DIR, "real-musical-catalog.json");
export const DEFAULT_DECISION_PATH = path.join(PACK_DIR, "owner-decision.json");
export const DEFAULT_PORT = 8765;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wav": "audio/wav",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ico": "image/x-icon"
};

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function verifyCatalogHashes(catalogPath = CATALOG_PATH) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const results = (catalog.examples || []).map((example) => {
    const wavPath = example.WAV_PATH;
    const exists = fs.existsSync(wavPath);
    const live = exists ? sha256File(wavPath) : null;
    return {
      id: example.id,
      exists,
      expected: example.SHA256,
      live,
      match: exists && live === example.SHA256
    };
  });
  const wavCount = results.filter((r) => r.exists).length;
  const unique = new Set(results.filter((r) => r.live).map((r) => r.live)).size;
  return {
    ok: results.length >= 3 && results.every((r) => r.match),
    wavCount,
    uniqueSha256: unique,
    hashMatch: results.every((r) => r.match),
    musicalQualityPass: false,
    results
  };
}

export function pendingDecision() {
  return {
    schema: "uaos.owner-listening-decision/v1",
    decision: "PENDING",
    recordedAt: null,
    explicitOwnerClick: false,
    autoFromPlayback: false,
    publicRelease: false,
    productionDeploy: false,
    payment: false,
    task: "TASK-05-00605-MUSICAL_BRAIN_CONTRACT",
    gate: "OWNER_GATE",
    notesByExample: {},
    overallNotes: "",
    examplesPlayed: []
  };
}

export function readDecision(decisionPath = DEFAULT_DECISION_PATH) {
  if (!fs.existsSync(decisionPath)) return { ...pendingDecision(), fileExists: false };
  const parsed = JSON.parse(fs.readFileSync(decisionPath, "utf8"));
  return { ...pendingDecision(), ...parsed, fileExists: true };
}

export function applyOwnerDecision(body, decisionPath = DEFAULT_DECISION_PATH) {
  if (!body || typeof body !== "object") {
    return { ok: false, errorCode: "INVALID_BODY" };
  }
  if (body.fromPlayback || body.autoApprove) {
    return { ok: false, errorCode: "PLAYBACK_IS_NOT_APPROVAL" };
  }
  if (body.explicitOwnerClick !== true) {
    return { ok: false, errorCode: "EXPLICIT_OWNER_CLICK_REQUIRED" };
  }
  const decision = String(body.decision || "");
  const allowed = ["OWNER_MUSICAL_LISTENING_PASS", "OWNER_MUSICAL_LISTENING_NEEDS_FIXES"];
  if (!allowed.includes(decision)) {
    return { ok: false, errorCode: "UNKNOWN_DECISION" };
  }
  if (decision === "OWNER_MUSICAL_LISTENING_PASS") {
    if (body.confirmPass !== true || body.confirmNoRelease !== true) {
      return { ok: false, errorCode: "PASS_CONFIRMATION_REQUIRED" };
    }
  }
  const notesByExample = body.notesByExample && typeof body.notesByExample === "object" ? body.notesByExample : {};
  const overallNotes = String(body.overallNotes || "").trim();
  if (decision === "OWNER_MUSICAL_LISTENING_NEEDS_FIXES") {
    const exampleNotes = Object.values(notesByExample).some((n) => String(n || "").trim());
    if (!overallNotes && !exampleNotes) {
      return { ok: false, errorCode: "NOTES_REQUIRED_FOR_NEEDS_FIXES" };
    }
  }
  const record = {
    schema: "uaos.owner-listening-decision/v1",
    decision,
    recordedAt: new Date().toISOString(),
    explicitOwnerClick: true,
    autoFromPlayback: false,
    publicRelease: false,
    productionDeploy: false,
    payment: false,
    task: "TASK-05-00605-MUSICAL_BRAIN_CONTRACT",
    gate: decision === "OWNER_MUSICAL_LISTENING_PASS" ? "OWNER_RECORDED_LOCAL_PASS" : "OWNER_GATE",
    notesByExample,
    overallNotes,
    examplesPlayed: Array.isArray(body.examplesPlayed) ? body.examplesPlayed : [],
    confirmPass: decision === "OWNER_MUSICAL_LISTENING_PASS",
    confirmNoRelease: body.confirmNoRelease === true,
    musicalQualityClaimOnCatalog: false
  };
  fs.mkdirSync(path.dirname(decisionPath), { recursive: true });
  fs.writeFileSync(decisionPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return { ok: true, record };
}

function safeJoin(root, requestPath) {
  const rel = decodeURIComponent(requestPath.split("?")[0]).replace(/^\/+/, "") || "owner-listening.html";
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

export function createOwnerListeningServer({
  port = DEFAULT_PORT,
  packDir = PACK_DIR,
  decisionPath = DEFAULT_DECISION_PATH
} = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1`);
    if (req.method === "GET" && url.pathname === "/api/status") {
      const verify = verifyCatalogHashes(path.join(packDir, "real-musical-catalog.json"));
      const decision = readDecision(decisionPath);
      json(res, 200, {
        OWNER_LISTENING_UI: "READY",
        hashVerify: verify,
        decision: decision.decision,
        publicRelease: false,
        autoPass: false,
        controller: false
      });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/decision") {
      json(res, 200, readDecision(decisionPath));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/played") {
      readBody(req).then((body) => {
        json(res, 200, { ok: true, recordedPass: false, decisionUnchanged: true, played: body?.id || null });
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/decision") {
      readBody(req).then((body) => {
        const result = applyOwnerDecision(body, decisionPath);
        json(res, result.ok ? 200 : 400, result);
      });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      json(res, 405, { ok: false, errorCode: "METHOD_NOT_ALLOWED" });
      return;
    }
    const filePath = safeJoin(packDir, url.pathname === "/" ? "owner-listening.html" : url.pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      json(res, 404, { ok: false, errorCode: "NOT_FOUND" });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
  return {
    server,
    listen() {
      return new Promise((resolve) => {
        server.listen(port, "127.0.0.1", () => resolve({ port, url: `http://127.0.0.1:${port}/` }));
      });
    },
    close() {
      return new Promise((resolve) => server.close(resolve));
    }
  };
}

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(raw);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve(null);
      }
    });
  });
}

export function startOwnerListeningUi({
  port = Number(process.env.UAOS_OWNER_LISTEN_PORT || DEFAULT_PORT),
  packDir = PACK_DIR,
  decisionPath = DEFAULT_DECISION_PATH
} = {}) {
  return createOwnerListeningServer({ port, packDir, decisionPath }).listen();
}
