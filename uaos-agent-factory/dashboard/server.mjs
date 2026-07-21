import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FACTORY_ROOT,
  readJson,
  atomicWriteJson,
  nowIso,
  isPidAlive,
  loadFactoryConfig
} from '../src/lib.mjs';
import { loadQueue, updateTask } from '../src/queue-manager.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';
import { writeMasterStatus } from '../src/reporter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = loadFactoryConfig();
const HOST = cfg.dashboardHost || '127.0.0.1';
const PORT = cfg.dashboardPort || 17321;

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

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    sendJson(res, 200, snapshot());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/pause') {
    atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'PAUSE'), { at: nowIso() });
    sendJson(res, 200, { ok: true, action: 'pause' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/resume') {
    const p = path.join(FACTORY_ROOT, 'state', 'PAUSE');
    if (fs.existsSync(p)) fs.unlinkSync(p);
    sendJson(res, 200, { ok: true, action: 'resume' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/stop') {
    atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'STOP'), { at: nowIso() });
    sendJson(res, 200, { ok: true, action: 'stop' });
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/human/')) {
    const parts = url.pathname.split('/');
    const lane = parts[3];
    const taskId = parts[4];
    const decision = parts[5];
    if (!['singy', 'arranger', 'library'].includes(lane)) {
      sendJson(res, 400, { ok: false, error: 'bad lane' });
      return;
    }
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 8000) body = body.slice(0, 8000);
    });
    req.on('end', () => {
      const note = body ? (() => { try { return JSON.parse(body).note || ''; } catch { return body; } })() : '';
      if (decision === 'approve') {
        updateTask(lane, taskId, {
          status: 'passed',
          result: { human: 'approved', note, at: nowIso() }
        });
      } else {
        updateTask(lane, taskId, {
          status: 'blocked',
          result: { human: 'rejected', note, at: nowIso() }
        });
      }
      writeMasterStatus();
      sendJson(res, 200, { ok: true, lane, taskId, decision });
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`UAOS Factory Dashboard http://${HOST}:${PORT}`);
});
