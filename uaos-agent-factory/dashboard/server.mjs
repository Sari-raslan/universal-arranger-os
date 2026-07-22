import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  FACTORY_ROOT,
  readJson,
  atomicWriteJson,
  nowIso,
  isPidAlive,
  loadFactoryConfig,
  timingSafeEqualString
} from '../src/lib.mjs';
import {
  loadQueue,
  getTask,
  transitionTask,
  isValidTaskIdFormat
} from '../src/queue-manager.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';
import { writeMasterStatus } from '../src/reporter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = loadFactoryConfig();
const HOST = cfg.dashboardHost || '127.0.0.1';
const PORT = cfg.dashboardPort || 17321;
const DASHBOARD_ORIGIN = `http://${HOST}:${PORT}`;
const ALLOWED_HOSTS = new Set([`${HOST}:${PORT}`, `127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const CSRF_COOKIE = 'uaos_factory_csrf';
const CSRF_HEADER = 'x-csrf-token';
const AUDIT_LOG = path.join(FACTORY_ROOT, 'logs', 'dashboard-audit.log');

/** Rotated on every dashboard process start — never logged. */
export const CSRF_TOKEN = crypto.randomBytes(32).toString('hex');

function audit(event) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    const safe = { ...event, at: nowIso() };
    delete safe.csrfToken;
    delete safe.token;
    fs.appendFileSync(AUDIT_LOG, `${JSON.stringify(safe)}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function snapshot() {
  const lanes = {};
  for (const lane of ['singy', 'arranger', 'library']) {
    const q = loadQueue(lane);
    const current =
      q.tasks.find((t) =>
        ['running', 'scouting', 'testing', 'reviewing', 'waiting_human'].includes(t.status)
      ) || q.tasks.find((t) => ['pending', 'ready', 'retry'].includes(t.status));
    lanes[lane] = {
      tasks: q.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        humanGate: !!t.humanGate,
        firstBlocker: t.result?.firstBlocker || null
      })),
      currentTask: current?.id || null,
      currentStatus: current?.status || 'idle'
    };
  }
  const factory = readJson(path.join(FACTORY_ROOT, 'state', 'factory-state.json'), {});
  const sup = readJson(path.join(FACTORY_ROOT, 'state', 'supervisor.pid.json'), {});
  return {
    updatedAt: nowIso(),
    factory,
    supervisorAlive: isPidAlive(sup.pid),
    supervisorPid: sup.pid || null,
    resources: evaluateResources(),
    lanes,
    master: readJson(path.join(FACTORY_ROOT, 'reports', 'MASTER_STATUS_LATEST.json'), null)
  };
}

function sendJson(res, code, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
    ...extraHeaders
  });
  res.end(body);
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function csrfSetCookieHeader() {
  return `${CSRF_COOKIE}=${encodeURIComponent(CSRF_TOKEN)}; Path=/; SameSite=Strict; HttpOnly; Max-Age=86400`;
}

/**
 * Validate Host + Origin + CSRF for browser mutation requests.
 * Returns null if ok, or { code, error } on failure.
 */
export function validateMutationSecurity(req) {
  const host = String(req.headers.host || '');
  if (!ALLOWED_HOSTS.has(host)) {
    return { code: 403, error: 'CSRF_VALIDATION_FAILED', detail: 'bad_host' };
  }

  const origin = req.headers.origin;
  // Browser mutations send Origin; reject missing/foreign Origin.
  if (!origin || origin !== DASHBOARD_ORIGIN) {
    // Also accept exact localhost origin when Host was localhost
    const localhostOrigin = `http://localhost:${PORT}`;
    if (!(host.startsWith('localhost:') && origin === localhostOrigin)) {
      return { code: 403, error: 'CSRF_VALIDATION_FAILED', detail: 'bad_origin' };
    }
  }

  const ct = String(req.headers['content-type'] || '').trim();
  if (ct && !/^(application\/json|text\/plain)(;|$)/i.test(ct)) {
    return { code: 400, error: 'INVALID_CONTENT_TYPE' };
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  if (!cookieToken || !headerToken) {
    return { code: 403, error: 'CSRF_VALIDATION_FAILED', detail: 'missing_token' };
  }
  if (!timingSafeEqualString(cookieToken, CSRF_TOKEN) || !timingSafeEqualString(headerToken, CSRF_TOKEN)) {
    return { code: 403, error: 'CSRF_VALIDATION_FAILED', detail: 'bad_token' };
  }
  return null;
}

function readBody(req, limit = 8000) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > limit) body = body.slice(0, limit);
    });
    req.on('end', () => resolve(body));
    req.on('error', () => resolve(''));
  });
}

export async function handleHumanGate(lane, taskId, decision, bodyText) {
  if (!['singy', 'arranger', 'library'].includes(lane)) {
    return { code: 400, body: { ok: false, error: 'INVALID_LANE' } };
  }
  if (!isValidTaskIdFormat(taskId)) {
    return { code: 400, body: { ok: false, error: 'INVALID_TASK_ID' } };
  }
  if (!['approve', 'reject'].includes(decision)) {
    return { code: 400, body: { ok: false, error: 'INVALID_HUMAN_ACTION' } };
  }

  let note = '';
  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === 'object') {
        note = typeof parsed.note === 'string' ? parsed.note : '';
      } else {
        return { code: 400, body: { ok: false, error: 'INVALID_HUMAN_ACTION' } };
      }
    } catch {
      return { code: 400, body: { ok: false, error: 'INVALID_HUMAN_ACTION' } };
    }
  }

  const task = getTask(lane, taskId);
  if (!task) {
    return { code: 404, body: { ok: false, error: 'TASK_NOT_FOUND' } };
  }
  if (!task.humanGate && task.status !== 'waiting_human') {
    return { code: 409, body: { ok: false, error: 'HUMAN_GATE_NOT_AVAILABLE' } };
  }

  const patch =
    decision === 'approve'
      ? {
          status: 'passed',
          result: { human: 'approved', note, at: nowIso() }
        }
      : {
          status: 'blocked',
          blockingReason: 'HUMAN_REJECTED',
          result: { human: 'rejected', note, at: nowIso() }
        };

  const tr = transitionTask(lane, taskId, patch);
  if (!tr.ok) {
    return {
      code: tr.reason === 'TASK_NOT_FOUND' ? 404 : 409,
      body: { ok: false, error: tr.reason || 'TRANSITION_FAILED' }
    };
  }
  try {
    writeMasterStatus();
  } catch {
    /* status write failure must not crash dashboard */
  }
  audit({ action: 'human_gate', lane, taskId, decision, noteLen: note.length });
  return { code: 200, body: { ok: true, lane, taskId, decision } };
}

export function createDashboardHandler() {
  return async function dashboardHandler(req, res) {
    try {
      const url = new URL(req.url || '/', DASHBOARD_ORIGIN);

      if (req.method === 'GET' && url.pathname === '/') {
        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        // Embed CSRF for same-origin dashboard script (also set as cookie).
        html = html.replace(
          '</head>',
          `<meta name="csrf-token" content="${CSRF_TOKEN}" />\n</head>`
        );
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': csrfSetCookieHeader(),
          'Cache-Control': 'no-store'
        });
        res.end(html);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/csrf') {
        sendJson(
          res,
          200,
          { ok: true, csrfToken: CSRF_TOKEN },
          { 'Set-Cookie': csrfSetCookieHeader() }
        );
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/status') {
        sendJson(res, 200, snapshot(), { 'Set-Cookie': csrfSetCookieHeader() });
        return;
      }

      const isMutation =
        req.method === 'POST' ||
        req.method === 'PUT' ||
        req.method === 'PATCH' ||
        req.method === 'DELETE';

      if (isMutation) {
        const sec = validateMutationSecurity(req);
        if (sec) {
          audit({ action: 'csrf_reject', path: url.pathname, detail: sec.detail || sec.error });
          sendJson(res, sec.code, { ok: false, error: sec.error });
          return;
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/pause') {
        atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'PAUSE'), { at: nowIso() });
        audit({ action: 'pause' });
        sendJson(res, 200, { ok: true, action: 'pause' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/resume') {
        const p = path.join(FACTORY_ROOT, 'state', 'PAUSE');
        if (fs.existsSync(p)) fs.unlinkSync(p);
        audit({ action: 'resume' });
        sendJson(res, 200, { ok: true, action: 'resume' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/stop') {
        atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'STOP'), { at: nowIso() });
        audit({ action: 'stop' });
        sendJson(res, 200, { ok: true, action: 'stop' });
        return;
      }

      if (req.method === 'POST' && url.pathname.startsWith('/api/human/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        // api / human / lane / taskId / decision
        const lane = parts[2];
        const taskId = parts[3] ? decodeURIComponent(parts[3]) : '';
        const decision = parts[4];
        const bodyText = await readBody(req);
        const out = await handleHumanGate(lane, taskId, decision, bodyText);
        sendJson(res, out.code, out.body);
        return;
      }

      if (isMutation) {
        sendJson(res, 404, { ok: false, error: 'not found' });
        return;
      }

      sendJson(res, 404, { ok: false, error: 'not found' });
    } catch (err) {
      audit({ action: 'unhandled', error: String(err?.message || err) });
      try {
        sendJson(res, 500, { ok: false, error: 'INTERNAL_ERROR' });
      } catch {
        /* ignore */
      }
    }
  };
}

export function startDashboardServer({ host = HOST, port = PORT } = {}) {
  const server = http.createServer(createDashboardHandler());
  server.listen(port, host, () => {
    console.log(`UAOS Factory Dashboard http://${host}:${port}`);
  });
  return server;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]).replace(/\\/g, '/').endsWith('/dashboard/server.mjs');

if (isMain) {
  startDashboardServer();
}
