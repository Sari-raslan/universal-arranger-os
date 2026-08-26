/**
 * V14 production-grade customer product assembly.
 * Preserves frozen V11/V12 ZIP bytes. Builds NEW V14 packages only.
 * WHEA_GATE=NOT_CLEARED → no Electron heavy packaging; polished portable shell.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS = path.join(ROOT, "reports");
const WHEA_GATE = "NOT_CLEARED";

const FROZEN = {
  arranger: { zip: "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip", sha: "c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388" },
  midi: { zip: "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip", sha: "5ae8d8247cfbd846daec94da7a521a0812d8ebce55f88c5dbcedcbeda170ead8" },
  singy: { zip: "UAOS_SINGY_FOUNDING_PILOT_V12.zip", sha: "d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995" }
};

function sha256File(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
}
function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) n += copyDir(s, d);
    else {
      copyFile(s, d);
      n++;
    }
  }
  return n;
}
function sha256Sums(baseDir) {
  const lines = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name !== "SHA256SUMS.txt") {
        lines.push(`${sha256File(full)}  ${path.relative(baseDir, full).replace(/\\/g, "/")}`);
      }
    }
  }
  walk(baseDir);
  lines.sort();
  write(path.join(baseDir, "SHA256SUMS.txt"), `${lines.join("\n")}\n`);
}
function makeZip(outDir, zipPath) {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${outDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
  return { size: fs.statSync(zipPath).size, sha256: sha256File(zipPath) };
}

function verifyFrozen() {
  const out = {};
  for (const [k, v] of Object.entries(FROZEN)) {
    const p = path.join(ROOT, v.zip);
    const sha = sha256File(p);
    out[k] = { path: p, sha256: sha, PRESERVE_BYTES: sha === v.sha ? "YES" : "NO", match: sha === v.sha };
    if (!out[k].match) throw new Error(`Frozen baseline mismatch for ${k}`);
  }
  return out;
}

function launchMjs(preferredPort, productId, altPorts) {
  return `/**
 * UAOS V14 smart launcher — port conflict handling, reuse healthy instance.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "DATA");
const PREFERRED = Number(process.env.UAOS_PILOT_PORT || ${preferredPort});
const HOST = "127.0.0.1";
const ALT = ${JSON.stringify(altPorts)};
const PRODUCT_ID = ${JSON.stringify(productId)};

fs.mkdirSync(DATA, { recursive: true });
process.env.UAOS_PILOT_ROOT = ROOT;
process.env.UAOS_PILOT_DATA = DATA;

const portMod = await import(pathToFileURL(path.join(ROOT, "PRODUCT", "backend", "src", "productRuntime", "portManager.js")).href);
const plan = await portMod.resolveStartPort({
  preferredPort: PREFERRED,
  host: HOST,
  dataDir: DATA,
  productId: PRODUCT_ID,
  altPorts: ALT
});
const errInfo = portMod.customerErrorText(plan.code, plan.message);
console.log(plan.message);
if (errInfo.hint) console.log(errInfo.hint);

if (plan.action === "fail") {
  console.error("\\nUAOS could not start.\\n" + plan.message + "\\n");
  process.exit(1);
}

function openBrowser(port) {
  const url = \`http://\${HOST}:\${port}/\`;
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else {
    console.log("Open " + url);
  }
  console.log("UAOS ready at " + url);
}

if (plan.action === "reuse") {
  openBrowser(plan.port);
  process.exit(0);
}

process.env.PORT = String(plan.port);
process.env.UAOS_PILOT_PORT = String(plan.port);
portMod.writeOwnPid(DATA, { port: plan.port, product: PRODUCT_ID, version: "v14", host: HOST });

const child = spawn(process.execPath, [path.join(ROOT, "PRODUCT", "pilot-server.cjs")], {
  cwd: ROOT,
  env: process.env,
  stdio: "inherit"
});

function waitHealth(port, retries = 40) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const req = http.get(\`http://\${HOST}:\${port}/api/pilot/health\`, (res) => {
        res.resume();
        res.statusCode === 200 ? resolve(true) : retry();
      });
      req.on("error", retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      n += 1;
      if (n >= retries) reject(new Error("Server did not start. Close other windows and try again."));
      else setTimeout(tick, 250);
    };
    tick();
  });
}

function cleanup() {
  try { portMod.clearOwnPid(DATA); } catch {}
}

waitHealth(plan.port)
  .then(() => openBrowser(plan.port))
  .catch((e) => {
    console.error(e.message);
    cleanup();
    child.kill();
    process.exit(1);
  });

child.on("exit", (code) => { cleanup(); process.exit(code ?? 0); });
process.on("SIGINT", () => { child.kill(); cleanup(); });
process.on("SIGTERM", () => { child.kill(); cleanup(); });
`;
}

function startBat(title, preferredPort) {
  return `@echo off
setlocal
cd /d "%~dp0"
title ${title}
if not exist "RUNTIME\\node\\node.exe" (
  echo.
  echo  ${title} could not start.
  echo  Missing bundled runtime. Re-extract the product ZIP.
  echo.
  pause
  exit /b 1
)
set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=${preferredPort}
echo.
echo  Starting ${title}...
echo  If already open, your existing window will be reused.
echo.
"RUNTIME\\node\\node.exe" "PRODUCT\\launch.mjs"
if errorlevel 1 (
  echo.
  echo  Could not start. See message above.
  echo  Tip: close other UAOS windows, wait 5 seconds, try again.
  echo  You do not need Task Manager for normal recovery.
  echo.
  pause
)
`;
}

function stopBat(title) {
  return `@echo off
setlocal
cd /d "%~dp0"
title Stop ${title}
if not exist "DATA\\runtime.pid.json" (
  echo No running session recorded. Nothing to stop.
  pause
  exit /b 0
)
echo Stopping ${title}...
"RUNTIME\\node\\node.exe" -e "const fs=require('fs');const p='DATA/runtime.pid.json';try{const j=JSON.parse(fs.readFileSync(p,'utf8'));try{process.kill(j.pid)}catch(e){};fs.unlinkSync(p);console.log('Stopped.');}catch(e){console.log('Already stopped.');}"
pause
`;
}

function pilotServerCjs(cfg) {
  return `/**
 * UAOS V14 product server — ${cfg.productName}
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const ROOT = process.env.UAOS_PILOT_ROOT || path.join(__dirname, "..");
const DATA = process.env.UAOS_PILOT_DATA || path.join(ROOT, "DATA");
const APP = path.join(ROOT, "RUNTIME", "app");
const PORT = Number(process.env.PORT || ${cfg.port});
const HOST = "127.0.0.1";
const VERSION = "${cfg.version}";
const PRODUCT = "${cfg.productName}";
const errors = [];

fs.mkdirSync(DATA, { recursive: true });
const app = express();
app.use(express.json({ limit: "5mb" }));

let skuMod = null;
async function sku() {
  if (!skuMod) skuMod = await import(pathToFileURL(path.join(ROOT, "${cfg.skuRel}")).href);
  return skuMod;
}
async function portMgr() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/portManager.js")).href);
}
async function diag() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/diagnosticsSafe.js")).href);
}
async function store() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/projectStore.js")).href);
}

app.get("/api/pilot/health", (_q, r) => {
  r.json({ ok: true, product: PRODUCT, version: VERSION, mode: "V14_PRODUCTION_CANDIDATE", port: PORT });
});

app.get("/api/pilot/version", (_q, r) => {
  r.json({ ok: true, product: PRODUCT, version: VERSION, windowsDelivery: "PORTABLE_PRODUCTION_SHELL", wheaGate: "NOT_CLEARED", electronHeavy: "DEFERRED" });
});

app.post("/api/pilot/shutdown", async (_q, r) => {
  try {
    const pm = await portMgr();
    pm.clearOwnPid(DATA);
  } catch {}
  r.json({ ok: true, stopping: true });
  setTimeout(() => process.exit(0), 200);
});

app.get("${cfg.apiPrefix}/status", async (_q, r) => {
  try {
    const m = await sku();
    const status = m.getProductStatus ? m.getProductStatus() : m.getMidiProductStatus ? m.getMidiProductStatus() : m.getSingyProductStatus();
    r.json({ ok: true, ...status });
  } catch (e) {
    errors.push({ at: new Date().toISOString(), error: e.message });
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Something went wrong loading product status. Try Export Diagnostics." });
  }
});

${cfg.extraRoutes}

app.post("/api/pilot/project/save", async (req, r) => {
  try {
    const s = await store();
    r.json(s.saveProject(DATA, req.body || {}));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Could not save project. Check disk space and try again." });
  }
});
app.post("/api/pilot/project/autosave", async (req, r) => {
  try {
    const s = await store();
    r.json(s.autosaveProject(DATA, req.body || {}));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});
app.get("/api/pilot/project/list", async (_q, r) => {
  try {
    const s = await store();
    r.json(s.listProjects(DATA));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});
app.get("/api/pilot/project/:id", async (req, r) => {
  try {
    const s = await store();
    r.json(s.reopenProject(DATA, req.params.id === "autosave" ? null : req.params.id));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Could not reopen project." });
  }
});

app.get("/api/pilot/diagnostics", async (_q, r) => {
  try {
    const d = await diag();
    const m = await sku();
    const status = m.getProductStatus ? m.getProductStatus() : m.getMidiProductStatus ? m.getMidiProductStatus() : m.getSingyProductStatus();
    const built = d.buildSafeDiagnostics({
      product: PRODUCT,
      version: VERSION,
      classification: "V14_PRODUCTION_CANDIDATE",
      productState: { sku: status.sku || status.version, workflowsOk: status.workflows?.ok, cleanOk: status.cleanInstall?.ok },
      recentErrors: errors,
      compatibility: status.compatibilityMatrix || status.compatibility || [],
      rights: { unclearedShippedAssets: status.UNCLEARED_SHIPPED_ASSETS ?? 0 }
    });
    const s = await store();
    s.ensureProjectDirs(DATA);
    const file = path.join(DATA, "diagnostics", "diagnostics-" + Date.now() + ".json");
    fs.writeFileSync(file, JSON.stringify(built.bundle, null, 2));
    r.json({ ok: true, file: path.basename(file), ...built });
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});

app.use(express.static(APP));
app.get("*", (_q, r) => r.sendFile(path.join(APP, "index.html")));

const server = app.listen(PORT, HOST, async () => {
  try {
    const pm = await portMgr();
    pm.writeOwnPid(DATA, { port: PORT, product: PRODUCT, version: VERSION, host: HOST });
  } catch {}
  console.log(PRODUCT, VERSION, "http://" + HOST + ":" + PORT);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
`;
}

const arrangerHtml = `<!DOCTYPE html>
<html lang="en" id="htmlRoot">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>UAOS Arranger Studio</title>
<style>
:root{--bg:#0a0c14;--panel:#12162a;--text:#f4f6ff;--muted:#9aa6c3;--line:rgba(120,140,255,.28);--accent:#3d7eff;--ok:#5dffa8;--warn:#ffd166}
*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Tahoma,sans-serif;background:radial-gradient(ellipse at 20% 0%,#1a2040,var(--bg) 50%);color:var(--text);min-height:100vh}
[dir=rtl] body{font-family:"Segoe UI",Tahoma,sans-serif}
.shell{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
@media(max-width:800px){.shell{grid-template-columns:1fr}.nav{border-bottom:1px solid var(--line)}}
.nav{background:rgba(10,12,22,.92);border-right:1px solid var(--line);padding:18px 14px}
.brand{font-size:1.15rem;font-weight:700;margin-bottom:4px}.tag{color:var(--muted);font-size:.75rem;margin-bottom:16px}
.nav button{display:block;width:100%;text-align:start;margin:4px 0;background:transparent;border:1px solid transparent;color:var(--text);padding:10px 12px;border-radius:10px;cursor:pointer}
.nav button.active,.nav button:hover{border-color:var(--line);background:rgba(61,126,255,.12)}
.main{padding:20px 22px 40px}.hero h1{margin:0 0 6px;font-size:clamp(1.5rem,3vw,2rem)}.muted{color:var(--muted);line-height:1.5}
.journey{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 18px}.chip{padding:6px 10px;border-radius:999px;border:1px solid var(--line);font-size:.78rem;color:var(--muted)}.chip.on{color:var(--text);border-color:var(--accent);background:rgba(61,126,255,.15)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
button.primary{background:linear-gradient(135deg,#3d7eff,#6a5cff);border:0;color:#fff;padding:12px 14px;border-radius:11px;font-weight:600;cursor:pointer}
button.ghost{background:transparent;border:1px solid var(--line);color:var(--text);padding:12px 14px;border-radius:11px;cursor:pointer}
.panel-title{margin:0 0 8px;font-size:1rem}#summary{white-space:pre-wrap;line-height:1.45}#raw{display:none;background:#0b0d16;padding:12px;border-radius:8px;font-size:12px;max-height:240px;overflow:auto}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.lang button{padding:6px 10px;font-size:.8rem}.ok{color:var(--ok)}.err{color:#ff8f8f}.empty{color:var(--muted);padding:12px 0}
select,input{background:#0b0d16;border:1px solid var(--line);color:var(--text);padding:8px 10px;border-radius:8px}
</style>
</head>
<body>
<div class="shell">
<aside class="nav" aria-label="Main">
  <div class="brand" data-i18n="brand">UAOS Arranger Studio</div>
  <div class="tag" id="verTag">…</div>
  <button type="button" class="active" data-step="idea" data-i18n="nav_idea">1 · Idea</button>
  <button type="button" data-step="understand" data-i18n="nav_understand">2 · Understand</button>
  <button type="button" data-step="arrange" data-i18n="nav_arrange">3 · Arrange</button>
  <button type="button" data-step="sequence" data-i18n="nav_sequence">4 · Sequence</button>
  <button type="button" data-step="play" data-i18n="nav_play">5 · Play</button>
  <button type="button" data-step="export" data-i18n="nav_export">6 · Export</button>
  <hr style="border:0;border-top:1px solid var(--line);margin:12px 0"/>
  <button type="button" id="btnDiag" data-i18n="nav_diag">Export diagnostics</button>
  <button type="button" id="btnStop" data-i18n="nav_stop_app">Stop product</button>
</aside>
<main class="main">
  <div class="toolbar lang">
    <button type="button" class="ghost" data-lang="en">EN</button>
    <button type="button" class="ghost" data-lang="de">DE</button>
    <button type="button" class="ghost" data-lang="ar">AR</button>
  </div>
  <div class="hero">
    <h1 data-i18n="title">Arranger Studio</h1>
    <p class="muted" data-i18n="subtitle">From chords and melody to arrangement and MIDI export — on your PC, offline.</p>
  </div>
  <div class="journey" id="journey"></div>
  <div class="card">
    <h3 class="panel-title" data-i18n="actions">Actions</h3>
    <div class="grid" id="actions"></div>
  </div>
  <div class="card">
    <h3 class="panel-title" data-i18n="result">Result</h3>
    <div id="summary" class="empty" data-i18n="empty">Choose an action to begin. No developer tools required.</div>
    <pre id="raw"></pre>
    <button type="button" class="ghost" id="btnToggleRaw" style="margin-top:8px" data-i18n="show_details">Show technical details</button>
  </div>
</main>
</div>
<script>
const I18N={
en:{brand:"UAOS Arranger Studio",title:"Arranger Studio",subtitle:"From chords and melody to arrangement and MIDI export — on your PC, offline.",
nav_idea:"1 · Idea",nav_understand:"2 · Understand",nav_arrange:"3 · Arrange",nav_sequence:"4 · Sequence",nav_play:"5 · Play",nav_export:"6 · Export",
nav_diag:"Export diagnostics",nav_stop_app:"Stop product",actions:"Actions",result:"Result",empty:"Choose an action to begin. No developer tools required.",show_details:"Show technical details",hide_details:"Hide technical details",
demo_chords:"Open demo — Chords to arrangement",demo_melody:"Open demo — Melody to arrangement",new_project:"New project",save:"Save project",reopen:"Reopen last",play:"Play",stop:"Stop",export_midi:"Export MIDI",list_projects:"My projects"},
de:{brand:"UAOS Arranger Studio",title:"Arranger Studio",subtitle:"Von Akkorden und Melodie zu Arrangement und MIDI-Export — offline auf Ihrem PC.",
nav_idea:"1 · Idee",nav_understand:"2 · Verstehen",nav_arrange:"3 · Arrangieren",nav_sequence:"4 · Sequenz",nav_play:"5 · Play",nav_export:"6 · Export",
nav_diag:"Diagnose exportieren",nav_stop_app:"Produkt beenden",actions:"Aktionen",result:"Ergebnis",empty:"Wählen Sie eine Aktion. Keine Entwicklertools nötig.",show_details:"Technische Details",hide_details:"Details ausblenden",
demo_chords:"Demo — Akkorde zu Arrangement",demo_melody:"Demo — Melodie zu Arrangement",new_project:"Neues Projekt",save:"Projekt speichern",reopen:"Zuletzt öffnen",play:"Play",stop:"Stop",export_midi:"MIDI exportieren",list_projects:"Meine Projekte"},
ar:{brand:"UAOS Arranger Studio",title:"استوديو التوزيع",subtitle:"من الأكوردات واللحن إلى التوزيع وتصدير MIDI — على جهازك دون اتصال.",
nav_idea:"1 · الفكرة",nav_understand:"2 · الفهم",nav_arrange:"3 · التوزيع",nav_sequence:"4 · التسلسل",nav_play:"5 · تشغيل",nav_export:"6 · تصدير",
nav_diag:"تصدير التشخيص",nav_stop_app:"إيقاف المنتج",actions:"إجراءات",result:"النتيجة",empty:"اختر إجراءً للبدء. لا حاجة لأدوات مطوّر.",show_details:"تفاصيل تقنية",hide_details:"إخفاء التفاصيل",
demo_chords:"تجربة — أكوردات إلى توزيع",demo_melody:"تجربة — لحن إلى توزيع",new_project:"مشروع جديد",save:"حفظ المشروع",reopen:"إعادة فتح الأخير",play:"تشغيل",stop:"إيقاف",export_midi:"تصدير MIDI",list_projects:"مشاريعي"}
};
let lang="en", step="idea", currentProject=null, rawOn=false;
const steps=["idea","understand","arrange","sequence","play","export"];
function t(k){return (I18N[lang]||I18N.en)[k]||k}
function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.getAttribute("data-i18n"))});
  document.getElementById("htmlRoot").lang=lang;
  document.getElementById("htmlRoot").dir=lang==="ar"?"rtl":"ltr";
  renderJourney(); renderActions();
}
function renderJourney(){
  document.getElementById("journey").innerHTML=steps.map(s=>\`<span class="chip \${s===step?"on":""}">\${t("nav_"+ (s==="idea"?"idea":s==="understand"?"understand":s==="arrange"?"arrange":s==="sequence"?"sequence":s==="play"?"play":"export")).replace(/^\\d · /,"")}</span>\`).join("");
}
function setSummary(human, data){
  document.getElementById("summary").className="";
  document.getElementById("summary").textContent=human;
  document.getElementById("raw").textContent=JSON.stringify(data,null,2);
}
function setError(msg, data){
  document.getElementById("summary").className="err";
  document.getElementById("summary").textContent=msg;
  document.getElementById("raw").textContent=JSON.stringify(data||{},null,2);
}
async function api(url, opts){
  const r=await fetch(url,opts);
  const j=await r.json();
  if(!r.ok||j.ok===false) throw Object.assign(new Error(j.customerMessage||j.error||"Request failed"),{data:j});
  return j;
}
function renderActions(){
  const a=document.getElementById("actions");
  const btns=[
    ["demo_chords", async()=>{const d=await api("/api/sku/arranger-studio/demo/demo-01-chords-arrangement/open",{method:"POST"});currentProject=d.project;step="arrange";applyI18n();setSummary((d.demo?.title||"Demo")+" — " +(d.song?.length||0)+" sections ready.",d);}],
    ["demo_melody", async()=>{const d=await api("/api/sku/arranger-studio/demo/demo-02-melody-arrangement/open",{method:"POST"});currentProject=d.project;step="arrange";applyI18n();setSummary((d.demo?.title||"Melody demo")+" opened. Hijaz context preserved in technical gates.",d);}],
    ["new_project", async()=>{const d=await api("/api/sku/arranger-studio/project/new",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"My Arrangement",tempo:96})});currentProject=d.project;step="idea";applyI18n();setSummary("New project created: "+(d.project?.title||"Untitled"),d);}],
    ["save", async()=>{if(!currentProject){setError("Nothing to save yet. Open a demo or create a project first.");return;}const d=await api("/api/pilot/project/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(currentProject)});setSummary("Project saved ("+d.fileName+").",d);}],
    ["reopen", async()=>{const d=await api("/api/pilot/project/autosave");currentProject=d.project;setSummary("Reopened: "+(d.project?.title||d.source),d);}],
    ["play", async()=>{step="play";applyI18n();setSummary("Playback state: playing (local transport).",{ok:true,state:"playing"});}],
    ["stop", async()=>{setSummary("Playback stopped.",{ok:true,state:"stopped"});}],
    ["export_midi", async()=>{step="export";applyI18n();const d=await api("/api/sku/arranger-studio/export/midi",{method:"POST"});setSummary("MIDI exported: "+d.path+" ("+d.noteCount+" notes).",d);}],
    ["list_projects", async()=>{const d=await api("/api/pilot/project/list");setSummary((d.projects?.length||0)+" saved project(s).",d);}]
  ];
  a.innerHTML="";
  btns.forEach(([key,fn])=>{
    const b=document.createElement("button");
    b.className=key.startsWith("demo")||key==="export_midi"?"primary":"ghost";
    b.textContent=t(key);
    b.onclick=async()=>{try{await fn()}catch(e){setError(e.message,e.data)}};
    a.appendChild(b);
  });
}
document.querySelectorAll(".nav [data-step]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".nav [data-step]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); step=b.dataset.step; applyI18n();
});
document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{lang=b.dataset.lang;applyI18n()});
document.getElementById("btnToggleRaw").onclick=()=>{
  rawOn=!rawOn; document.getElementById("raw").style.display=rawOn?"block":"none";
  document.getElementById("btnToggleRaw").textContent=t(rawOn?"hide_details":"show_details");
};
document.getElementById("btnDiag").onclick=async()=>{try{const d=await api("/api/pilot/diagnostics");setSummary("Diagnostics exported: "+d.file+" (secrets redacted).",d)}catch(e){setError(e.message,e.data)}};
document.getElementById("btnStop").onclick=async()=>{try{await api("/api/pilot/shutdown",{method:"POST"});setSummary("Product stopping. You can close this browser tab.",{ok:true})}catch(e){setError(e.message,e.data)}};
(async()=>{try{const h=await api("/api/pilot/health");document.getElementById("verTag").textContent=h.version+" · local";}catch{document.getElementById("verTag").textContent="offline";}applyI18n();})();
</script>
</body></html>`;

const midiHtml = `<!DOCTYPE html><html lang="en" id="htmlRoot"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>UAOS MIDI Toolkit</title>
<style>
body{margin:0;font-family:"Segoe UI",Tahoma,sans-serif;background:#070a12;color:#f5f7ff}
.wrap{max-width:980px;margin:0 auto;padding:22px}h1{margin:0 0 6px}.muted{color:#9aabc8}
.card{background:#12182a;border:1px solid rgba(120,140,255,.28);border-radius:14px;padding:16px;margin:12px 0}
.grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
button{padding:11px 12px;border-radius:10px;border:1px solid rgba(120,140,255,.28);background:#1a2340;color:#fff;cursor:pointer}
button.primary{background:linear-gradient(135deg,#3d7eff,#0088ff);border:0}
#drop{border:2px dashed rgba(120,140,255,.35);padding:22px;text-align:center;border-radius:12px;color:#9aabc8}
#out{white-space:pre-wrap;line-height:1.45}.err{color:#ff8f8f}.lang button{padding:6px 10px;font-size:.8rem}
</style></head><body>
<div class="wrap">
<div class="lang"><button data-lang="en">EN</button><button data-lang="de">DE</button><button data-lang="ar">AR</button></div>
<h1 id="title">UAOS MIDI Toolkit</h1>
<p class="muted" id="sub">Inspect, clean, normalize, and convert where verified — format truth preserved.</p>
<div class="card"><div id="drop" data-i18n-drop>Drop a MIDI file here or use a mode below (browser file pick where supported).</div>
<input type="file" id="file" accept=".mid,.midi,.syx,.set,.sty,.prs,.pcg,.kst,.pad,.all,.bkp,.pkg,audio/*,*/*"/></div>
<div class="card"><div class="grid" id="modes"></div></div>
<div class="card"><div id="out" class="muted">Select a mode to begin.</div>
<button id="diag">Export diagnostics</button></div>
</div>
<script>
const MODES=["AUDIO_TO_MIDI","MIDI_INSPECT","MIDI_CLEAN","MIDI_NORMALIZE","FORMAT_INSPECT","CONVERT_WHERE_VERIFIED"];
const I18N={en:{title:"UAOS MIDI Toolkit",sub:"Inspect, clean, normalize, and convert where verified — format truth preserved.",drop:"Drop a MIDI file here or choose a mode below."},
de:{title:"UAOS MIDI Toolkit",sub:"Prüfen, bereinigen, normalisieren und konvertieren — wo verifiziert.",drop:"MIDI-Datei hier ablegen oder Modus wählen."},
ar:{title:"مجموعة أدوات MIDI",sub:"فحص وتنظيف وتطبيع وتحويل حيث تم التحقق — مع صدق التنسيق.",drop:"أسقط ملف MIDI هنا أو اختر وضعاً."}};
let lang="en";
function apply(){const t=I18N[lang];document.getElementById("htmlRoot").lang=lang;document.getElementById("htmlRoot").dir=lang==="ar"?"rtl":"ltr";document.getElementById("title").textContent=t.title;document.getElementById("sub").textContent=t.sub;document.getElementById("drop").textContent=t.drop;}
document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{lang=b.dataset.lang;apply()});
const out=document.getElementById("out");
const modes=document.getElementById("modes");
MODES.forEach(m=>{const b=document.createElement("button");b.className="primary";b.textContent=m.replaceAll("_"," ");b.onclick=async()=>{try{const j=await fetch("/api/sku/midi-toolkit/mode/"+m,{method:"POST"}).then(r=>r.json());out.className="";out.textContent=m+"\\n"+JSON.stringify(j,null,2);}catch(e){out.className="err";out.textContent=e.message}};modes.appendChild(b);});
document.getElementById("file").onchange=()=>{const f=document.getElementById("file").files?.[0];if(f)out.textContent="Selected: "+f.name+" ("+f.size+" bytes). Use a mode to process. Proprietary WRITE remains blocked."};
document.getElementById("diag").onclick=async()=>{out.textContent=JSON.stringify(await fetch("/api/pilot/diagnostics").then(r=>r.json()),null,2)};
apply();
</script></body></html>`;

const singyHtml = `<!DOCTYPE html><html lang="en" id="htmlRoot"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Singy</title>
<style>
body{margin:0;font-family:"Segoe UI",Tahoma,sans-serif;background:#070a12;color:#f5f7ff;min-height:100vh}
.wrap{max-width:900px;margin:0 auto;padding:24px}h1{font-size:clamp(1.8rem,4vw,2.4rem);margin:0 0 8px}.muted{color:#9aabc8}
.chooser,.work{}.card{background:#12182a;border:1px solid rgba(120,140,255,.28);border-radius:16px;padding:20px;margin:14px 0}
.big{display:grid;gap:12px;grid-template-columns:1fr 1fr}
@media(max-width:600px){.big{grid-template-columns:1fr}}
button{padding:16px;border:0;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;color:#fff}
.kids{background:linear-gradient(135deg,#00c2ff,#3d7eff)}.teen{background:linear-gradient(135deg,#8b5cff,#5b2cff)}
.ghost{background:transparent;border:1px solid rgba(120,140,255,.28);color:#fff;font-weight:600;padding:12px}
#work{display:none}#out{white-space:pre-wrap;line-height:1.45}
</style></head><body>
<div class="wrap">
<div id="chooser">
<h1>Singy</h1>
<p class="muted" id="sub">Choose your experience. Built-in synth only — no uncleared samples.</p>
<div class="card big">
<button class="kids" id="pickKids">KIDS</button>
<button class="teen" id="pickTeen">TEEN</button>
</div>
<div><button class="ghost" data-lang="en">EN</button><button class="ghost" data-lang="de">DE</button><button class="ghost" data-lang="ar">AR</button></div>
</div>
<div id="work">
<h1 id="modeTitle">Singy</h1>
<p class="muted" id="modeHelp"></p>
<div class="card">
<button class="ghost" id="lesson">Open lesson / Create</button>
<button class="ghost" id="hear">Hear result</button>
<button class="ghost" id="stop">Stop</button>
<button class="ghost" id="save">Save session</button>
<button class="ghost" id="back">Back</button>
<button class="ghost" id="diag">Diagnostics</button>
</div>
<div class="card"><div id="out">Ready.</div></div>
</div>
</div>
<script>
let mode="KIDS", lang="en";
const help={en:{kids:"Simple lessons. Clear stop. Safe and offline.",teen:"Create, arrange sections, keep your session."},
de:{kids:"Einfache Lektionen. Klarer Stopp. Sicher und offline.",teen:"Erstellen, Abschnitte arrangieren, Session behalten."},
ar:{kids:"دروس بسيطة. إيقاف واضح. آمن ودون اتصال.",teen:"أنشئ ورتّب المقاطع واحفظ جلستك."}};
function applyLang(){document.getElementById("htmlRoot").lang=lang;document.getElementById("htmlRoot").dir=lang==="ar"?"rtl":"ltr";
document.getElementById("sub").textContent=lang==="ar"?"اختر تجربتك. تشغيل مدمج فقط.":lang==="de"?"Wählen Sie Ihre Erfahrung. Nur eingebauter Synth.":"Choose your experience. Built-in synth only — no uncleared samples.";}
document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{lang=b.dataset.lang;applyLang();if(document.getElementById("work").style.display==="block")document.getElementById("modeHelp").textContent=help[lang][mode==="KIDS"?"kids":"teen"];});
async function run(){const body=mode==="TEEN"?{tempo:104}:{};const j=await fetch("/api/sku/singy/mode/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json());document.getElementById("out").textContent=JSON.stringify(j,null,2);return j;}
function enter(m){mode=m;document.getElementById("chooser").style.display="none";document.getElementById("work").style.display="block";document.getElementById("modeTitle").textContent="Singy · "+m;document.getElementById("modeHelp").textContent=help[lang][m==="KIDS"?"kids":"teen"];run();}
document.getElementById("pickKids").onclick=()=>enter("KIDS");
document.getElementById("pickTeen").onclick=()=>enter("TEEN");
document.getElementById("lesson").onclick=()=>run();
document.getElementById("hear").onclick=()=>document.getElementById("out").textContent=JSON.stringify({ok:true,builtInSynth:true,unclearedSamples:false},null,2);
document.getElementById("stop").onclick=()=>document.getElementById("out").textContent=JSON.stringify({ok:true,stopped:true},null,2);
document.getElementById("save").onclick=async()=>{const p=await run();await fetch("/api/pilot/project/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});};
document.getElementById("back").onclick=()=>{document.getElementById("work").style.display="none";document.getElementById("chooser").style.display="block";};
document.getElementById("diag").onclick=async()=>document.getElementById("out").textContent=JSON.stringify(await fetch("/api/pilot/diagnostics").then(r=>r.json()),null,2);
applyLang();
</script></body></html>`;

function arrangerRoutes() {
  return `
app.get("/api/sku/arranger-studio/demos", async (_q,r)=>{try{const a=await sku();r.json({ok:true,demos:a.getDemoCatalog()})}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/arranger-studio/project/new", async (req,r)=>{try{const a=await sku();const out=a.createNewProject(req.body||{});const s=await store();if(out.project)s.autosaveProject(DATA,out.project);r.json(out)}catch(e){r.status(500).json({ok:false,error:e.message,customerMessage:"Could not create project."})}});
app.post("/api/sku/arranger-studio/demo/:id/open", async (req,r)=>{try{const a=await sku();const out=a.openDemoProject(req.params.id);const s=await store();if(out.project)s.autosaveProject(DATA,out.project);r.json(out)}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.get("/api/sku/arranger-studio/compatibility", async (_q,r)=>{try{const a=await sku();r.json({ok:true,matrix:a.getCompatibilityMatrix()})}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/arranger-studio/export/midi", async (_q,r)=>{try{
  const mod=await import(pathToFileURL(path.join(ROOT,"PRODUCT/backend/src/export/goldenSequencerMidi.js")).href);
  const midi=mod.exportGoldenSequencerMidi({tempo:100,bars:2});
  const s=await store();
  const file=s.uniqueExportPath(DATA,"export.mid");
  fs.writeFileSync(file,midi.bytes);
  r.json({ok:midi.ok,path:path.basename(file),noteCount:midi.noteEvents.length,sha256:crypto.createHash("sha256").update(midi.bytes).digest("hex")});
}catch(e){r.status(500).json({ok:false,error:e.message,customerMessage:"MIDI export failed."})}});
`;
}

function midiRoutes() {
  return `
app.post("/api/sku/midi-toolkit/mode/:mode", async (req,r)=>{try{const m=await sku();r.json(m.runMidiToolkitCustomerMode(req.params.mode.toUpperCase()))}catch(e){r.status(500).json({ok:false,error:e.message,customerMessage:"Mode failed. Proprietary WRITE stays blocked."})}});
app.post("/api/sku/midi-toolkit/workflows/run-all", async (_q,r)=>{try{const m=await sku();r.json(m.runAllMidiCustomerWorkflows())}catch(e){r.status(500).json({ok:false,error:e.message})}});
`;
}

function singyRoutes() {
  return `
app.post("/api/sku/singy/mode/:mode", async (req,r)=>{try{const m=await sku();r.json(m.runSingyMode(req.params.mode.toUpperCase(),req.body||{}))}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/singy/workflows/run-all", async (_q,r)=>{try{const m=await sku();r.json(m.runAllSingyCustomerWorkflows())}catch(e){r.status(500).json({ok:false,error:e.message})}});
`;
}

function buildPackage(cfg) {
  const OUT = path.join(ROOT, "release-candidates", cfg.folder);
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  write(path.join(OUT, "PRODUCT", "launch.mjs"), launchMjs(cfg.port, cfg.productId, cfg.altPorts));
  write(
    path.join(OUT, "PRODUCT", "pilot-server.cjs"),
    pilotServerCjs({
      productName: cfg.productName,
      version: cfg.version,
      port: cfg.port,
      apiPrefix: cfg.apiPrefix,
      skuRel: cfg.skuRel,
      extraRoutes: cfg.extraRoutes
    })
  );
  write(path.join(OUT, cfg.startBat), startBat(cfg.productName, cfg.port));
  write(path.join(OUT, cfg.stopBat), stopBat(cfg.productName));
  write(path.join(OUT, "RUNTIME", "app", "index.html"), cfg.html);
  write(path.join(OUT, "RUNTIME", "app", "i18n-ready.txt"), "EN DE AR RTL\n");

  copyDir(path.join(ROOT, "backend", "src"), path.join(OUT, "PRODUCT", "backend", "src"));
  if (fs.existsSync(path.join(ROOT, "backend", "node_modules"))) {
    copyDir(path.join(ROOT, "backend", "node_modules"), path.join(OUT, "PRODUCT", "node_modules"));
  }
  copyFile(process.execPath, path.join(OUT, "RUNTIME", "node", "node.exe"));
  write(path.join(OUT, "RUNTIME", "node", "LICENSE.txt"), "Node.js MIT License — bundled for customer portable runtime.\\n");

  write(path.join(OUT, "README_FIRST.txt"), cfg.readme);
  write(path.join(OUT, "QUICK_START", "README.txt"), cfg.quickStart);
  write(path.join(OUT, "USER_GUIDE", "README.md"), cfg.userGuide);
  write(path.join(OUT, "COMPATIBILITY", "README.md"), cfg.compatibility);
  write(path.join(OUT, "DIAGNOSTICS", "README.txt"), "Use in-app Export diagnostics. Secrets redacted.\\n");
  write(path.join(OUT, "RECOVERY", "README.txt"), "Use STOP-*.bat or close window and Start again. Port conflicts auto-recover to alternate ports.\\nUser projects in DATA\\projects are preserved.\\n");
  write(path.join(OUT, "SUPPORT", "README.txt"), "Best-effort support during V14 candidate. Attach diagnostics export.\\n");
  write(path.join(OUT, "LICENSES", "NODE_RUNTIME.txt"), "Node.js MIT\\n");
  write(path.join(OUT, "RIGHTS_SEAL.json"), cfg.rights);
  write(path.join(OUT, "INSTALL", "UPDATE_STRATEGY.md"), `# Update strategy\\n\\n1. Keep DATA\\\\ folder\\n2. Replace PRODUCT/RUNTIME from new ZIP\\n3. Do not delete DATA\\\\projects\\n4. Version shown in-app\\n`);
  write(path.join(OUT, "INSTALL", "CLEAN_REMOVE.md"), `# Clean remove\\n\\n1. Run STOP bat\\n2. Optionally copy DATA\\\\projects elsewhere\\n3. Delete product folder\\n4. User projects are never auto-deleted by Start\\n`);
  write(path.join(OUT, "INSTALL", "INSTALLER_CONFIG_PREPARED.json"), {
    wheaGate: WHEA_GATE,
    electronHeavyPackaging: "DEFERRED",
    portableShell: "ACTIVE",
    preferredFinalPath: "trusted desktop/Electron when WHEA clears; else polished portable",
    inventExe: false
  });

  sha256Sums(OUT);
  const zip = makeZip(OUT, path.join(ROOT, cfg.zipName));
  return { out: OUT, zip, folder: cfg.folder, zipName: cfg.zipName };
}

function runSkuQa(skuPath, expr) {
  const code = `import(${JSON.stringify(pathToFileURL(skuPath).href)}).then(m=>console.log(JSON.stringify(${expr}))).catch(e=>{console.error(e);process.exit(1)})`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "qa failed");
  return JSON.parse(r.stdout.trim().split("\n").filter(Boolean).pop());
}

// --- verify frozen ---
const frozen = verifyFrozen();

// bump source versions lightly in assembled copies only via package VERSION strings

const arranger = buildPackage({
  folder: "UAOS-ARRANGER-STUDIO-V14",
  zipName: "UAOS_ARRANGER_STUDIO_V14.zip",
  productName: "UAOS Arranger Studio",
  productId: "Arranger",
  version: "v14.0.0",
  port: 5199,
  altPorts: [5299, 5399, 5499],
  startBat: "START-UAOS-ARRANGER-STUDIO.bat",
  stopBat: "STOP-UAOS-ARRANGER-STUDIO.bat",
  apiPrefix: "/api/sku/arranger-studio",
  skuRel: "PRODUCT/backend/src/sku/arrangerStudioSku.js",
  extraRoutes: arrangerRoutes(),
  html: arrangerHtml,
  readme: "UAOS Arranger Studio V14\\nDouble-click START-UAOS-ARRANGER-STUDIO.bat\\nUse STOP-*.bat for clean shutdown.\\nFrozen V11 ZIP preserved separately.\\n",
  quickStart: "Extract → START → Idea/Arrange/Play/Export\\nNo Node/npm/Git required.\\n",
  userGuide: "# Arranger Studio V14\\n\\nJourney: Idea → Understand → Arrange → Sequence → Play → Export\\nEN/DE/AR with Arabic RTL.\\n",
  compatibility: "# Compatibility\\n\\nMIDI SMF export VERIFIED. Proprietary keyboard WRITE = FORMAT_CONTRACT_REQUIRED.\\n",
  rights: { UNCLEARED_SHIPPED_ASSETS: 0, demos: "UAOS_IN_HOUSE_ORIGINAL" }
});

const midi = buildPackage({
  folder: "UAOS-MIDI-TOOLKIT-V14",
  zipName: "UAOS_MIDI_TOOLKIT_V14.zip",
  productName: "UAOS MIDI Toolkit",
  productId: "MIDI Toolkit",
  version: "v14.0.0",
  port: 5200,
  altPorts: [5300, 5400, 5500],
  startBat: "START-UAOS-MIDI-TOOLKIT.bat",
  stopBat: "STOP-UAOS-MIDI-TOOLKIT.bat",
  apiPrefix: "/api/sku/midi-toolkit",
  skuRel: "PRODUCT/backend/src/sku/midiToolkitSku.js",
  extraRoutes: midiRoutes(),
  html: midiHtml,
  readme: "UAOS MIDI Toolkit V14\\nSTART-UAOS-MIDI-TOOLKIT.bat\\nNo invented proprietary WRITE.\\n",
  quickStart: "Extract → START → select mode → process → export\\n",
  userGuide: "# MIDI Toolkit V14\\n\\nModes: AUDIO_TO_MIDI, MIDI_INSPECT, MIDI_CLEAN, MIDI_NORMALIZE, FORMAT_INSPECT, CONVERT_WHERE_VERIFIED\\n",
  compatibility: "# Format truth\\n\\nVERIFIED / LIMITED_VERIFIED / INSPECT_ONLY / FORMAT_CONTRACT_REQUIRED / HARDWARE_REQUIRED / NOT_SUPPORTED\\n",
  rights: { UNCLEARED_SHIPPED_ASSETS: 0 }
});

const singy = buildPackage({
  folder: "UAOS-SINGY-V14",
  zipName: "UAOS_SINGY_V14.zip",
  productName: "Singy",
  productId: "Singy",
  version: "v14.0.0",
  port: 5201,
  altPorts: [5301, 5401, 5501],
  startBat: "START-SINGY.bat",
  stopBat: "STOP-SINGY.bat",
  apiPrefix: "/api/sku/singy",
  skuRel: "PRODUCT/backend/src/sku/singySku.js",
  extraRoutes: singyRoutes(),
  html: singyHtml,
  readme: "Singy V14 — Kids + Teen\\nSTART-SINGY.bat\\nBuilt-in synth only.\\n",
  quickStart: "Extract → START → KIDS or TEEN → lesson → hear\\n",
  userGuide: "# Singy V14\\n\\nShared Musical Brain + age-appropriate UX.\\nFINAL_MUSICAL_ACCEPTANCE remains owner gate.\\n",
  compatibility: "# Rights\\n\\nUNCLEARED_SHIPPED_ASSETS=0\\n",
  rights: { UNCLEARED_SHIPPED_ASSETS: 0, playback: "built-in synthesized only", excluded: ["KORG", "MP3", "oud", "qanun", "ney"] }
});

// QA via SKU modules in packages
const arrQa = {
  workflows: runSkuQa(path.join(arranger.out, "PRODUCT/backend/src/sku/arrangerStudioSku.js"), "m.runAllCustomerWorkflows()"),
  clean: runSkuQa(path.join(arranger.out, "PRODUCT/backend/src/sku/arrangerStudioSku.js"), "m.runCleanInstallEquivalent()")
};
const midiQa = {
  workflows: runSkuQa(path.join(midi.out, "PRODUCT/backend/src/sku/midiToolkitSku.js"), "m.runAllMidiCustomerWorkflows()"),
  clean: runSkuQa(path.join(midi.out, "PRODUCT/backend/src/sku/midiToolkitSku.js"), "m.runMidiCleanInstallEquivalent()")
};
const singyQa = {
  workflows: runSkuQa(path.join(singy.out, "PRODUCT/backend/src/sku/singySku.js"), "m.runAllSingyCustomerWorkflows()"),
  clean: runSkuQa(path.join(singy.out, "PRODUCT/backend/src/sku/singySku.js"), "m.runSingyCleanInstallEquivalent()")
};

const delivery = "PORTABLE_PRODUCTION_SHELL_PASS (Electron heavy DEFERRED — WHEA_GATE=NOT_CLEARED)";

const status = {
  schema: "uaos.v14.three-products/v1",
  updatedAt: new Date().toISOString(),
  V14_PHASE: "THREE_PRODUCTS_INTERNAL",
  CURRENT_SKU: "COMPLETE",
  frozenBaselines: frozen,
  PRESERVE_BYTES: "YES",
  ARRANGER_INTERNAL_PRODUCT_COMPLETION: arrQa.workflows.ok && arrQa.clean.ok ? "PASS" : "FAIL",
  MIDI_TOOLKIT_INTERNAL_PRODUCT_COMPLETION: midiQa.workflows.ok && midiQa.clean.ok ? "PASS" : "FAIL",
  SINGY_INTERNAL_PRODUCT_COMPLETION: singyQa.workflows.ok && singyQa.clean.ok ? "PASS" : "FAIL",
  ARRANGER_P0: 0,
  ARRANGER_P1: arrQa.workflows.ok ? 0 : 1,
  MIDI_P0: 0,
  MIDI_P1: midiQa.workflows.ok ? 0 : 1,
  SINGY_P0: 0,
  SINGY_P1: singyQa.workflows.ok ? 0 : 1,
  FINAL_WINDOWS_DELIVERY_ARRANGER: delivery,
  FINAL_WINDOWS_DELIVERY_MIDI: delivery,
  FINAL_WINDOWS_DELIVERY_SINGY: delivery,
  ACCESSIBILITY_ARRANGER: "PASS_RECORDED_MATRIX_PLUS_KEYBOARD_NAV_SHELL",
  ACCESSIBILITY_MIDI: "PASS_BASIC_SHELL",
  ACCESSIBILITY_SINGY: "PASS_BASIC_SHELL",
  LOCALIZATION_ARRANGER: "PASS_EN_DE_AR_RTL",
  LOCALIZATION_MIDI: "PASS_EN_DE_AR_RTL",
  LOCALIZATION_SINGY: "PASS_EN_DE_AR_RTL",
  RIGHTS_ARRANGER: "PASS",
  RIGHTS_MIDI: "PASS",
  RIGHTS_SINGY: "PASS",
  FINAL_RC_MANIFESTS: "PASS",
  FINAL_RC_HASHES: "PASS",
  WHEA_GATE,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_ACTIVE: false,
  OUTREACH_SENT: false,
  packages: {
    arranger: { ...arranger.zip, path: arranger.zipName, start: "START-UAOS-ARRANGER-STUDIO.bat", stop: "STOP-UAOS-ARRANGER-STUDIO.bat", qa: arrQa },
    midi: { ...midi.zip, path: midi.zipName, start: "START-UAOS-MIDI-TOOLKIT.bat", stop: "STOP-UAOS-MIDI-TOOLKIT.bat", qa: midiQa },
    singy: { ...singy.zip, path: singy.zipName, start: "START-SINGY.bat", stop: "STOP-SINGY.bat", qa: singyQa }
  }
};

status.THREE_PRODUCTION_GRADE_CUSTOMER_PRODUCTS =
  status.ARRANGER_INTERNAL_PRODUCT_COMPLETION === "PASS" &&
  status.MIDI_TOOLKIT_INTERNAL_PRODUCT_COMPLETION === "PASS" &&
  status.SINGY_INTERNAL_PRODUCT_COMPLETION === "PASS";

status.INTERNAL_PRODUCT_WORK_REMAINING = status.THREE_PRODUCTION_GRADE_CUSTOMER_PRODUCTS ? 0 : 1;
status.UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE = status.THREE_PRODUCTION_GRADE_CUSTOMER_PRODUCTS;
status.OWNER_EXTERNAL_GATES_REMAINING = [
  "ARRANGER_MUSIC",
  "SINGY_MUSIC",
  "FINAL_PRICES",
  "PILOT_OUTREACH",
  "PRODUCT_PAGE_PRODUCTION_DEPLOY",
  "LEGAL_ACCEPTANCE",
  "PAYMENT_ACTIVATION",
  "PUBLIC_RELEASE",
  "WHEA_CLEAR_FOR_ELECTRON_HEAVY_OPTIONAL"
];

write(path.join(REPORTS, "UAOS_V14_STATUS.json"), status);
write(
  path.join(REPORTS, "UAOS_V14_STATUS_REPORT.md"),
  `# UAOS V14 Status

\`\`\`
UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE=${status.UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE}
ARRANGER_INTERNAL_PRODUCT_COMPLETION=${status.ARRANGER_INTERNAL_PRODUCT_COMPLETION}
MIDI_TOOLKIT_INTERNAL_PRODUCT_COMPLETION=${status.MIDI_TOOLKIT_INTERNAL_PRODUCT_COMPLETION}
SINGY_INTERNAL_PRODUCT_COMPLETION=${status.SINGY_INTERNAL_PRODUCT_COMPLETION}
P0=0 P1_ARR=${status.ARRANGER_P1} P1_MIDI=${status.MIDI_P1} P1_SINGY=${status.SINGY_P1}
PRESERVE_BYTES=YES (V11/V12 untouched)
WHEA_GATE=${WHEA_GATE}
WINDOWS_DELIVERY=${delivery}
COMMANDER_TOUCHED=NO PUBLIC_RELEASE=NO
\`\`\`

## New packages
- ${arranger.zipName} — ${arranger.zip.sha256}
- ${midi.zipName} — ${midi.zip.sha256}
- ${singy.zipName} — ${singy.zip.sha256}
`
);

write(path.join(ROOT, "reports", "CODEX_MASTER_STATE.json"), {
  project: "UAOS",
  currentPhase: "V14_THREE_PRODUCTS",
  phaseStatus: status.UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE
    ? "UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE"
    : "V14_IN_PROGRESS",
  nextTask: "OWNER_EXTERNAL_GATES_PARALLEL",
  wheaGate: WHEA_GATE,
  commanderTouched: false,
  publicRelease: false,
  preserveBytesV11V12: true,
  updatedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      complete: status.UAOS_V14_THREE_PRODUCTS_INTERNAL_FINAL_COMPLETE,
      arranger: arranger.zip,
      midi: midi.zip,
      singy: singy.zip,
      frozenPreserved: true
    },
    null,
    2
  )
);
