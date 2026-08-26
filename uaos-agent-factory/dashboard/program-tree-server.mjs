#!/usr/bin/env node
/**
 * UAOS Program Tree Dashboard — local status server (no public deploy).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const RUNTIME = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree';
const PORT = 8787;

function readJson(p, fb={}){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fb; } }

function snapshot(){
  const tasks = readJson(path.join(TREE, 'TASKS.json'), { tasks: [] });
  const byState = {};
  for (const t of tasks.tasks || []) byState[t.state] = (byState[t.state] || 0) + 1;
  const latest = readJson(path.join(RUNTIME, 'LATEST-RUN.json'), {});
  const leases = fs.existsSync(path.join(RUNTIME, 'leases')) ? fs.readdirSync(path.join(RUNTIME, 'leases')).length : 0;
  const claims = fs.existsSync(path.join(RUNTIME, 'claims')) ? fs.readdirSync(path.join(RUNTIME, 'claims')).length : 0;
  return {
    at: new Date().toISOString(),
    status: latest.status || 'UNKNOWN',
    runDir: latest.runDir || null,
    taskCount: tasks.tasks?.length || 0,
    byState,
    activeClaims: claims,
    activeLeases: leases,
    commander: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED',
    truths: [
      'Technical WAV ≠ musical quality',
      'Fixtures ≠ product content',
      'Offline render ≠ realtime DSP',
      'No auto Kids/Teen/Pricing adoption'
    ]
  };
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>UAOS Program Tree Dashboard</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;background:#0f1419;color:#e7ecf1}
h1{margin:0 0 8px} .card{background:#1a222c;border:1px solid #2b3642;border-radius:10px;padding:16px;margin:12px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.k{opacity:.7;font-size:12px}.v{font-size:22px;font-weight:700}
code{color:#9ad1ff}
</style></head><body>
<h1>UAOS Program Tree Dashboard</h1>
<p>Local status only. No public deploy. Commander not activated.</p>
<div id="root" class="card">Loading…</div>
<script>
async function refresh(){
  const s = await fetch('/api/status').then(r=>r.json());
  const states = Object.entries(s.byState||{}).map(([k,v])=>'<div class="card"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('');
  document.getElementById('root').innerHTML = \`
    <div><b>Status:</b> \${s.status}</div>
    <div><b>Tasks:</b> \${s.taskCount} · Claims: \${s.activeClaims} · Leases: \${s.activeLeases}</div>
    <div><b>Commander:</b> <code>\${s.commander}</code></div>
    <div class="grid" style="margin-top:12px">\${states}</div>
    <ul>\${(s.truths||[]).map(t=>'<li>'+t+'</li>').join('')}</ul>
  \`;
}
refresh(); setInterval(refresh, 3000);
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(snapshot()));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`UAOS Program Tree Dashboard http://127.0.0.1:${PORT}`);
});
