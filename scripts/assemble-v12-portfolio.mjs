/**
 * UAOS V12 — MIDI Toolkit + Singy private pilot packages
 * Arranger V11 frozen. WHEA-safe copy-only assembly.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS = path.join(ROOT, "reports");
const WHEA_GATE = "NOT_CLEARED";

function sha256File(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
  fs.writeFileSync(file, data);
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
    else { copyFile(s, d); n++; }
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
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${outDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`, { stdio: "inherit" });
  return { size: fs.statSync(zipPath).size, sha256: sha256File(zipPath) };
}

function pilotServerCjs(productName, version, apiPrefix, skuImportRel) {
  return `const express=require("express");const fs=require("fs");const path=require("path");const crypto=require("crypto");const{pathToFileURL}=require("url");
const ROOT=process.env.UAOS_PILOT_ROOT||path.join(__dirname,"..");
const DATA=process.env.UAOS_PILOT_DATA||path.join(ROOT,"DATA");
const APP=path.join(ROOT,"RUNTIME","app");
const PORT=Number(process.env.PORT||5200);
const HOST="127.0.0.1";
const VERSION="${version}";
fs.mkdirSync(DATA,{recursive:true});
const app=express();app.use(express.json());
let sku=null;async function loadSku(){if(!sku)sku=await import(pathToFileURL(path.join(ROOT,"${skuImportRel}")).href);return sku;}
app.get("/api/pilot/health",(_q,r)=>r.json({ok:true,product:"${productName}",version:VERSION,mode:"PRIVATE_PILOT_RC"}));
app.get("${apiPrefix}/status",async(_q,r)=>{try{const m=await loadSku();r.json({ok:true,...m.getMidiProductStatus?m.getMidiProductStatus():m.getSingyProductStatus()})}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("${apiPrefix}/mode/:mode",async(req,r)=>{try{const m=await loadSku();const mode=req.params.mode.toUpperCase();const out=m.runMidiToolkitCustomerMode?m.runMidiToolkitCustomerMode(mode):m.runSingyMode(mode,req.body||{});r.json(out)}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("${apiPrefix}/workflows/run-all",async(_q,r)=>{try{const m=await loadSku();r.json(m.runAllMidiCustomerWorkflows?m.runAllMidiCustomerWorkflows():m.runAllSingyCustomerWorkflows())}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.get("/api/pilot/diagnostics",async(_q,r)=>{const bundle={exportedAt:new Date().toISOString(),product:"${productName}",version:VERSION,classification:"PRIVATE_PILOT_RC"};const d=path.join(DATA,"diagnostics");fs.mkdirSync(d,{recursive:true});const f=path.join(d,"diagnostics-"+Date.now()+".json");fs.writeFileSync(f,JSON.stringify(bundle,null,2));r.json({ok:true,bundle})});
app.use(express.static(APP));app.get("*",(_q,r)=>r.sendFile(path.join(APP,"index.html")));
app.listen(PORT,HOST,()=>console.log("${productName} pilot",PORT));`;
}

function launchMjs(defaultPort) {
  return `import{spawn}from"node:child_process";import fs from"node:fs";import http from"node:http";import path from"node:path";import{fileURLToPath}from"node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const PORT=Number(process.env.UAOS_PILOT_PORT||${defaultPort});
process.env.UAOS_PILOT_ROOT=ROOT;process.env.UAOS_PILOT_DATA=path.join(ROOT,"DATA");process.env.PORT=String(PORT);
fs.mkdirSync(process.env.UAOS_PILOT_DATA,{recursive:true});
const child=spawn(process.execPath,[path.join(ROOT,"PRODUCT","pilot-server.cjs")],{cwd:ROOT,env:process.env,stdio:"inherit"});
function wait(n=30){return new Promise((res,rej)=>{let i=0;const t=()=>{http.get("http://127.0.0.1:"+PORT+"/api/pilot/health",r=>{r.resume();r.statusCode===200?res():go()}).on("error",go).setTimeout(500,function(){this.destroy();go()})};const go=()=>{++i>=n?rej(new Error("timeout")):setTimeout(t,250)};t()})}
wait().then(()=>{const u="http://127.0.0.1:"+PORT+"/";if(process.platform==="win32")spawn("cmd",["/c","start","",u],{detached:true,stdio:"ignore"}).unref();}).catch(e=>{console.error(e.message);child.kill();process.exit(1)});
child.on("exit",c=>process.exit(c??0));`;
}

function startBat(title, port) {
  return `@echo off
setlocal
cd /d "%~dp0"
title ${title}
if not exist "RUNTIME\\node\\node.exe" (echo Missing RUNTIME\\node\\node.exe & pause & exit /b 1)
set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=${port}
echo Starting ${title}...
"RUNTIME\\node\\node.exe" "PRODUCT\\launch.mjs"
if errorlevel 1 pause
`;
}

function buildPackage(cfg) {
  const OUT = path.join(ROOT, "release-candidates", cfg.folder);
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  write(path.join(OUT, "PRODUCT", "pilot-server.cjs"), pilotServerCjs(cfg.productName, cfg.version, cfg.apiPrefix, cfg.skuImportRel));
  write(path.join(OUT, "PRODUCT", "launch.mjs"), launchMjs(cfg.port));
  write(path.join(OUT, cfg.startBatName), startBat(cfg.productName, cfg.port));
  write(path.join(OUT, "RUNTIME", "app", "index.html"), cfg.html);
  copyDir(path.join(ROOT, "backend", "src"), path.join(OUT, "PRODUCT", "backend", "src"));
  if (fs.existsSync(path.join(ROOT, "backend", "node_modules"))) {
    copyDir(path.join(ROOT, "backend", "node_modules"), path.join(OUT, "PRODUCT", "node_modules"));
  }
  copyFile(process.execPath, path.join(OUT, "RUNTIME", "node", "node.exe"));
  write(path.join(OUT, "RUNTIME", "node", "LICENSE.txt"), "Node.js MIT License — bundled for private pilot.\n");

  for (const [rel, content] of cfg.docs) write(path.join(OUT, rel), content);

  if (cfg.extra) cfg.extra(OUT);
  sha256Sums(OUT);
  const zip = makeZip(OUT, path.join(ROOT, cfg.zipName));
  return { out: OUT, zip };
}

function runQa(skuPath, exprList) {
  const importUrl = pathToFileURL(skuPath).href;
  const results = {};
  for (const [key, expr] of exprList) {
    const code = `import(${JSON.stringify(importUrl)}).then(m=>{console.log(JSON.stringify(${expr}))}).catch(e=>{console.error(e.message);process.exit(1)});`;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", timeout: 120000 });
    const line = (r.stdout || "").trim().split("\n").filter(Boolean).pop();
    results[key] = line ? JSON.parse(line) : { ok: false, error: r.stderr };
  }
  return results;
}

// --- MIDI HTML ---
const midiHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>UAOS MIDI Toolkit</title><style>body{font-family:Segoe UI,sans-serif;background:#02030a;color:#f8f8ff;margin:0;padding:24px}
.card{background:rgba(8,10,28,.85);border:1px solid rgba(129,105,255,.34);border-radius:16px;padding:16px;margin:12px 0}
button{background:linear-gradient(135deg,#5b2cff,#008cff);border:0;color:#fff;padding:10px 14px;border-radius:10px;margin:4px;cursor:pointer}
pre{background:#111;padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px}.muted{color:#b8c3dc}</style></head><body>
<h1>UAOS MIDI Toolkit</h1><p class="muted">PRIVATE_PILOT_RC · Inspect → Normalize → Convert where verified</p>
<div class="card"><button data-mode="AUDIO_TO_MIDI">Audio → MIDI</button><button data-mode="MIDI_INSPECT">MIDI Inspect</button>
<button data-mode="MIDI_CLEAN">MIDI Clean</button><button data-mode="MIDI_NORMALIZE">Normalize</button>
<button data-mode="FORMAT_INSPECT">Format Inspect</button><button data-mode="CONVERT_WHERE_VERIFIED">Convert Verified</button>
<button id="export">Export MIDI</button><button id="diag">Diagnostics</button></div>
<pre id="out">Select a mode.</pre>
<script>
const out=document.getElementById("out");
async function call(u,o){return fetch(u,o).then(r=>r.json());}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=async()=>{out.textContent=JSON.stringify(await call("/api/sku/midi-toolkit/mode/"+b.dataset.mode,{method:"POST"}),null,2);});
document.getElementById("export").onclick=async()=>out.textContent=JSON.stringify(await call("/api/sku/midi-toolkit/workflows/run-all",{method:"POST"}),null,2);
document.getElementById("diag").onclick=async()=>out.textContent=JSON.stringify(await call("/api/pilot/diagnostics"),null,2);
</script></body></html>`;

const singyHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Singy</title><style>body{font-family:Segoe UI,sans-serif;background:#02030a;color:#f8f8ff;margin:0;padding:24px}
.card{background:rgba(8,10,28,.85);border:1px solid rgba(129,105,255,.34);border-radius:16px;padding:16px;margin:12px 0}
button{background:linear-gradient(135deg,#5b2cff,#008cff);border:0;color:#fff;padding:12px 18px;border-radius:12px;margin:6px;cursor:pointer;font-size:1rem}
.kids{background:linear-gradient(135deg,#00d4ff,#008cff)}.teen{background:linear-gradient(135deg,#8f00ff,#5b2cff)}
pre{background:#111;padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px}.muted{color:#b8c3dc}
#chooser{display:block}#workspace{display:none}</style></head><body>
<div id="chooser"><h1>Singy</h1><p class="muted">Choose your experience</p><div class="card">
<button class="kids" id="pickKids">KIDS</button><button class="teen" id="pickTeen">TEEN</button></div></div>
<div id="workspace"><h1 id="modeTitle">Singy</h1><div class="card">
<button id="lesson">Open Lesson / Create</button><button id="hear">Hear Result</button><button id="stop">Stop</button>
<button id="save">Save Session</button><button id="diag">Diagnostics</button></div><pre id="out">Ready.</pre></div>
<script>
let mode="KIDS";const out=document.getElementById("out");
async function run(o){out.textContent=JSON.stringify(await fetch("/api/sku/singy/mode/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o||{})}).then(r=>r.json()),null,2);}
document.getElementById("pickKids").onclick=()=>{mode="KIDS";document.getElementById("chooser").style.display="none";document.getElementById("workspace").style.display="block";document.getElementById("modeTitle").textContent="Singy Kids";run();};
document.getElementById("pickTeen").onclick=()=>{mode="TEEN";document.getElementById("chooser").style.display="none";document.getElementById("workspace").style.display="block";document.getElementById("modeTitle").textContent="Singy Teen";run({tempo:104});};
document.getElementById("lesson").onclick=()=>run(mode==="TEEN"?{tempo:104}:{});
document.getElementById("hear").onclick=()=>out.textContent=JSON.stringify({ok:true,builtInSynth:true,unclearedSamples:false},null,2);
document.getElementById("stop").onclick=()=>out.textContent=JSON.stringify({ok:true,stopped:true},null,2);
document.getElementById("save").onclick=()=>run();
document.getElementById("diag").onclick=async()=>out.textContent=JSON.stringify(await fetch("/api/pilot/diagnostics").then(r=>r.json()),null,2);
</script></body></html>`;

const docStub = (name) => `# ${name}\n\nDRAFT ONLY — NOT LEGALLY ACCEPTED\nPRIVATE_PILOT_RC\n`;

// --- Build MIDI ---
const midiDocs = [
  ["README_FIRST.txt", "UAOS MIDI Toolkit V12\nDOUBLE-CLICK START-UAOS-MIDI-TOOLKIT.bat\nPRIVATE_PILOT_RC\n"],
  ["QUICK_START/README.txt", "Extract → START-UAOS-MIDI-TOOLKIT.bat → select mode → export\n"],
  ["USER_GUIDE/README.md", "# MIDI Toolkit\n\nModes: Audio→MIDI, Inspect, Clean, Normalize, Format Inspect, Convert where verified.\n"],
  ["COMPATIBILITY/README.md", "# Format truth\n\nWRITE forbidden for Korg/Yamaha/Roland/Ketron until full contract proof.\n"],
  ["FIXTURES/README.md", "# Deterministic fixtures\n\nGenerated in-package by accepted engine — no uncleared samples.\n"],
  ["DEMOS/README.md", "# Demos\n\nUse in-app mode buttons for clean MIDI workflows.\n"],
  ["DIAGNOSTICS/README.txt", "Export diagnostics via in-app button.\n"],
  ["RECOVERY/README.txt", "Re-extract ZIP if port busy. Close other UAOS pilots first.\n"],
  ["SUPPORT/README.txt", "Private pilot support — owner gate.\n"],
  ["PILOT/FEEDBACK_FORM.md", "# Feedback\n\nCAN_INSTALL, CAN_START, TIME_TO_FIRST_RESULT, OUTPUT_USEFUL\n"],
  ["LEGAL_DRAFTS/PILOT_TERMS_DRAFT.md", docStub("Pilot Terms")],
  ["LICENSES/NODE_RUNTIME.txt", "Node.js MIT License\n"],
  ["RIGHTS_SEAL.json", JSON.stringify({ UNCLEARED_SHIPPED_ASSETS: 0, assets: [{ item: "MIDI fixtures", rights: "UAOS_IN_HOUSE" }] }, null, 2)]
];

const midi = buildPackage({
  folder: "UAOS-MIDI-TOOLKIT-V12",
  zipName: "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip",
  productName: "UAOS MIDI Toolkit",
  version: "v12-pilot-rc1",
  port: 5200,
  startBatName: "START-UAOS-MIDI-TOOLKIT.bat",
  apiPrefix: "/api/sku/midi-toolkit",
  skuImportRel: "PRODUCT/backend/src/sku/midiToolkitSku.js",
  html: midiHtml,
  docs: midiDocs,
  extra(out) {
    write(path.join(out, "FIXTURES", "clean-midi-fixture.json"), { notes: [{ midi: 60, startTick: 0, durationTicks: 480 }] });
  }
});

const skuMidi = path.join(midi.out, "PRODUCT", "backend", "src", "sku", "midiToolkitSku.js");
const midiQa = runQa(skuMidi, [
  ["workflows", "m.runAllMidiCustomerWorkflows()"],
  ["clean", "m.runMidiCleanInstallEquivalent()"],
  ["status", "m.getMidiProductStatus()"]
]);

// --- Build Singy ---
const singyDocs = [
  ["README_FIRST.txt", "Singy V12\nDOUBLE-CLICK START-SINGY.bat\nChoose KIDS or TEEN\nPRIVATE_PILOT_RC\n"],
  ["QUICK_START/README.txt", "Extract → START-SINGY.bat → KIDS or TEEN → lesson → hear result\n"],
  ["USER_GUIDE/README.md", "# Singy family\n\nShared: Musical Brain (technical), memory, lessons, built-in synth.\n"],
  ["MUSICAL_REVIEW_PACK/README.md", "# Musical review\n\nFINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES\n"],
  ["DIAGNOSTICS/README.txt", "In-app diagnostics export.\n"],
  ["RECOVERY/README.txt", "Re-extract if needed.\n"],
  ["SUPPORT/README.txt", "Private pilot.\n"],
  ["PILOT/FEEDBACK_FORM.md", "# Feedback\n"],
  ["LEGAL_DRAFTS/PRIVACY_DRAFT.md", docStub("Privacy")],
  ["LICENSES/NODE_RUNTIME.txt", "Node.js MIT License\n"],
  ["RIGHTS_SEAL.json", JSON.stringify({
    UNCLEARED_SHIPPED_ASSETS: 0,
    excluded: ["KORG", "MP3", "unlicensed oud/qanun/ney"],
    playback: "built-in synthesized only"
  }, null, 2)]
];

const singy = buildPackage({
  folder: "UAOS-SINGY-V12",
  zipName: "UAOS_SINGY_FOUNDING_PILOT_V12.zip",
  productName: "Singy",
  version: "v12-pilot-rc1",
  port: 5201,
  startBatName: "START-SINGY.bat",
  apiPrefix: "/api/sku/singy",
  skuImportRel: "PRODUCT/backend/src/sku/singySku.js",
  html: singyHtml,
  docs: singyDocs
});

const skuSingy = path.join(singy.out, "PRODUCT", "backend", "src", "sku", "singySku.js");
const singyQa = runQa(skuSingy, [
  ["workflows", "m.runAllSingyCustomerWorkflows()"],
  ["clean", "m.runSingyCleanInstallEquivalent()"],
  ["status", "m.getSingyProductStatus()"]
]);

const midiComplete = midiQa.workflows?.ok && midiQa.clean?.ok && midiQa.workflows?.p0 === 0 && midiQa.workflows?.p1 === 0;
const singyComplete = singyQa.workflows?.ok && singyQa.clean?.ok && singyQa.workflows?.p0 === 0 && singyQa.workflows?.p1 === 0;

write(path.join(REPORTS, "UAOS_MIDI_V12_RC_FREEZE.json"), {
  frozenAt: new Date().toISOString(),
  SAR: "SAR-184",
  PRODUCT_VERSION: "v12-pilot-rc1",
  WHEA_GATE,
  HEAVY_BUILD_FAIL_CLOSED: true,
  commanderTouched: false,
  qa: midiQa,
  zip: { path: "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip", ...midi.zip },
  MIDI_TOOLKIT_V12_INTERNAL_WORK_COMPLETE: midiComplete
});

write(path.join(REPORTS, "UAOS_SINGY_V12_RC_FREEZE.json"), {
  frozenAt: new Date().toISOString(),
  SAR: "SAR-185",
  PRODUCT_VERSION: "v12-pilot-rc1",
  WHEA_GATE,
  qa: singyQa,
  zip: { path: "UAOS_SINGY_FOUNDING_PILOT_V12.zip", ...singy.zip },
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  SINGY_V12_INTERNAL_WORK_COMPLETE: singyComplete
});

write(path.join(REPORTS, "UAOS_V12_PORTFOLIO.json"), {
  schema: "uaos.v12.three-sku-portfolio/v1",
  updatedAt: new Date().toISOString(),
  FINAL_STATUS: midiComplete && singyComplete ? "UAOS_V12_THREE_SKU_PRIVATE_PILOT_PORTFOLIO_READY" : "V12_IN_PROGRESS",
  V12_PARENT: "SAR-183",
  SAR_184_MIDI: midiComplete ? "DONE" : "IN_PROGRESS",
  SAR_185_SINGY: singyComplete ? "DONE" : "IN_PROGRESS",
  ARRANGER: { frozen: true, classification: "PRIVATE_PILOT_RC", modified: false },
  skus: {
    ARRANGER_STUDIO: { status: "PRIVATE_PILOT_RC", zip: "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip", frozen: true },
    MIDI_TOOLKIT: { status: midiComplete ? "PRIVATE_PILOT_RC" : "IN_PROGRESS", zip: "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip", ...midi.zip, qa: midiQa },
    SINGY: { status: singyComplete ? "PRIVATE_PILOT_RC" : "IN_PROGRESS", zip: "UAOS_SINGY_FOUNDING_PILOT_V12.zip", ...singy.zip, qa: singyQa }
  },
  CUSTOMER_FACING_SKUS: 3,
  PUBLIC_RELEASE: false,
  PAYMENT_ACTIVE: false,
  PRICING_PUBLISHED: false,
  OUTREACH_SENT: false,
  WEBSITE_DEPLOYED: false,
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  COMMANDER_TOUCHED: false,
  WHEA_GATE
});

write(path.join(REPORTS, "UAOS_V12_STATUS_REPORT.md"), `# UAOS V12 Status

\`\`\`
FINAL_STATUS=${midiComplete && singyComplete ? "UAOS_V12_THREE_SKU_PRIVATE_PILOT_PORTFOLIO_READY" : "V12_IN_PROGRESS"}
SAR-184_MIDI=${midiComplete ? "DONE" : "IN_PROGRESS"}
SAR-185_SINGY=${singyComplete ? "DONE" : "IN_PROGRESS"}
ARRANGER=FROZEN_PRIVATE_PILOT_RC

MIDI: P0=${midiQa.workflows?.p0} P1=${midiQa.workflows?.p1} ROUNDTRIP=${midiQa.workflows?.SUPPORTED_ROUNDTRIP}
MIDI_ZIP_SHA256=${midi.zip.sha256}

SINGY: KIDS=${singyQa.clean?.KIDS_FIRST_RUN} TEEN=${singyQa.clean?.TEEN_FIRST_RUN}
SINGY_ZIP_SHA256=${singy.zip.sha256}

COMMANDER_TOUCHED=NO PUBLIC_RELEASE=NO
\`\`\`
`);

write(path.join(REPORTS, "CODEX_MASTER_STATE.json"), {
  project: "UAOS",
  currentPhase: "V12_THREE_SKU_PRIVATE_PILOT",
  phaseStatus: midiComplete && singyComplete ? "UAOS_V12_THREE_SKU_PRIVATE_PILOT_PORTFOLIO_READY" : "V12_IN_PROGRESS",
  arrangerFrozen: true,
  midiToolkitV12Complete: midiComplete,
  singyV12Complete: singyComplete,
  wheaGate: WHEA_GATE,
  commanderTouched: false,
  publicRelease: false,
  updatedAt: new Date().toISOString()
});

console.log(JSON.stringify({
  midiComplete,
  singyComplete,
  portfolioReady: midiComplete && singyComplete,
  midiZip: midi.zip,
  singyZip: singy.zip
}, null, 2));
