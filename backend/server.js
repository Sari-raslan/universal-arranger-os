$ErrorActionPreference="Continue"
$Repo = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Set-Location $Repo

function Log($m){
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Host $line
  Add-Content "reports\UAOS_AGENT_EXECUTOR_$Stamp.log" $line -Encoding UTF8
}

Log "UAOS AGENT EXECUTOR START"

New-Item -ItemType Directory -Force reports,agent-output,scripts | Out-Null

Log "Stopping old node processes"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Log "Cleaning BOM from project files"
$files = Get-ChildItem -Recurse -Include *.json,*.js,*.jsx,*.css,*.html,*.md,*.ps1 -File -ErrorAction SilentlyContinue
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach($f in $files){
  try{
    $t = Get-Content $f.FullName -Raw
    [System.IO.File]::WriteAllText($f.FullName, $t.TrimStart([char]0xFEFF), $utf8)
  }catch{}
}

Log "Writing Vercel config"
$json = '{"version":2,"buildCommand":"npm run build --prefix frontend","outputDirectory":"frontend/dist","installCommand":"npm install --prefix frontend","framework":"vite","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}'
[System.IO.File]::WriteAllText((Join-Path $Repo "vercel.json"), $json, $utf8)

Log "Writing backend server"
@'
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>res.json({ok:true, app:"UAOS HyperStation", version:"1.0.0", status:"running"}));
app.get("/health", (req,res)=>res.json({ok:true, backend:true, time:new Date().toISOString()}));
app.get("/scan", (req,res)=>res.json({ok:true, scan:true, modules:["frontend","backend","monitor","agent-output","reports"]}));
app.get("/api/status", (req,res)=>res.json({
  ok:true,
  project:"UAOS Core Runtime Alpha",
  modules:{
    deployment:true,
    monitoring:true,
    midi:"foundation",
    arranger:"foundation",
    sampler:"foundation",
    hardware:"foundation"
  }
}));

app.listen(PORT, ()=>console.log("UAOS backend running on http://localhost:" + PORT));
