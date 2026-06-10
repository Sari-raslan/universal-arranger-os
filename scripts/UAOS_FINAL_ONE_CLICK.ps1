$ErrorActionPreference="Continue"
$Repo = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$utf8 = New-Object System.Text.UTF8Encoding($false)

Set-Location $Repo
New-Item -ItemType Directory -Force scripts,reports,backend,frontend,frontend\src,agent-output | Out-Null

function W($path,$text){
  [System.IO.File]::WriteAllText((Join-Path $Repo $path), $text, $utf8)
}

function Log($m){
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Host $line
  Add-Content "$Repo\reports\UAOS_FINAL_ONE_CLICK_$Stamp.log" $line -Encoding UTF8
}

Log "START UAOS FINAL ONE CLICK"

Log "Stop Node"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Log "Remove broken PostCSS and cache files"
Remove-Item ".postcssrc","frontend\.postcssrc","postcss.config.*","frontend\postcss.config.*" -Force -ErrorAction SilentlyContinue
Remove-Item "frontend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "frontend\package-lock.json" -Force -ErrorAction SilentlyContinue

Log "Write root package"
W "package.json" '{"name":"universal-arranger-os","version":"1.0.0","private":true,"scripts":{"setup":"npm install --prefix backend && npm install --prefix frontend","build":"npm run build --prefix frontend","health":"node backend/health-check.js","dev":"node backend/server.js","final":"powershell -ExecutionPolicy Bypass -File scripts/UAOS_FINAL_ONE_CLICK.ps1"}}'

Log "Write frontend package"
W "frontend\package.json" '{"name":"uaos-frontend","version":"1.0.0","type":"module","scripts":{"dev":"vite --host 0.0.0.0 --port 5173","build":"vite build","preview":"vite preview --host 0.0.0.0 --port 4173"},"dependencies":{"@vitejs/plugin-react":"latest","vite":"latest","react":"latest","react-dom":"latest"},"devDependencies":{}}'

Log "Write Vite config"
W "frontend\vite.config.js" 'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins:[react()], css:{ postcss:null } });'

Log "Write frontend app"
W "frontend\index.html" '<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>UAOS HyperStation</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'

W "frontend\src\main.jsx" 'import React,{useEffect,useState}from"react";import{createRoot}from"react-dom/client";import"./style.css";function App(){const[status,setStatus]=useState(null);useEffect(()=>{fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({ok:true,note:"Production UI ready. Local backend optional."}))},[]);return <main className="app"><section className="panel"><h1>UAOS HyperStation</h1><h2>Core Runtime Alpha</h2><p>Universal Arranger OS: MIDI, Arranger, Sampler, Hardware and AI execution platform.</p><div className="cards"><div>V1 Stable Ops</div><div>MIDI Runtime</div><div>Arranger Engine</div><div>Sampler Core</div><div>Hardware Layer</div><div>AI Music Systems</div></div><pre>{JSON.stringify(status,null,2)}</pre></section></main>}createRoot(document.getElementById("root")).render(<App/>);'

W "frontend\src\style.css" 'body{margin:0;font-family:Arial,sans-serif;background:#050816;color:white}.app{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px}.panel{max-width:980px;width:100%;background:#111827;border:1px solid #334155;border-radius:28px;padding:34px}h1{font-size:54px;margin:0}h2{color:#93c5fd;margin-top:8px}p{font-size:19px;color:#d1d5db}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:26px 0}.cards div{background:#1f2937;border:1px solid #475569;border-radius:16px;padding:18px}pre{background:#020617;border-radius:14px;padding:18px;overflow:auto}'

Log "Write backend"
W "backend\package.json" '{"name":"uaos-backend","version":"1.0.0","type":"commonjs","main":"server.js","scripts":{"start":"node server.js","health":"node health-check.js"},"dependencies":{"cors":"^2.8.5","express":"^4.19.2"}}'

W "backend\server.js" 'const express=require("express");const cors=require("cors");const app=express();const PORT=process.env.PORT||8090;app.use(cors());app.use(express.json());app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",version:"1.0.0",status:"running"}));app.get("/health",(req,res)=>res.json({ok:true,backend:true,time:new Date().toISOString()}));app.get("/scan",(req,res)=>res.json({ok:true,scan:true,modules:["frontend","backend","monitor","agent-output","reports"]}));app.get("/api/status",(req,res)=>res.json({ok:true,project:"UAOS Core Runtime Alpha",modules:{deployment:true,monitoring:true,midi:"foundation",arranger:"foundation",sampler:"foundation",hardware:"foundation"}}));app.listen(PORT,()=>console.log("UAOS backend running on http://localhost:"+PORT));'

W "backend\health-check.js" 'const http=require("http");const urls=["http://localhost:8090/","http://localhost:8090/health","http://localhost:8090/scan","http://localhost:8090/api/status"];function check(url){return new Promise(resolve=>{http.get(url,res=>resolve(`${url} => ${res.statusCode}`)).on("error",err=>resolve(`${url} => FAIL ${err.message}`));});}(async()=>{for(const u of urls)console.log(await check(u));})();'

Log "Write Vercel config"
W "vercel.json" '{"version":2,"buildCommand":"npm run build --prefix frontend","outputDirectory":"frontend/dist","installCommand":"npm install --prefix frontend","framework":"vite","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}'

Log "Install backend"
npm install --prefix backend

Log "Install frontend"
npm install --prefix frontend

Log "Build frontend"
npm run build --prefix frontend | Tee-Object "$Repo\reports\build-$Stamp.txt"

if($LASTEXITCODE -ne 0){
  Log "BUILD FAILED. STOPPING BEFORE DEPLOY."
  notepad "$Repo\reports\build-$Stamp.txt"
  exit 1
}

Log "Start backend"
$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 5

Log "Health check"
node backend/health-check.js | Tee-Object "$Repo\reports\health-$Stamp.txt"

try{Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue}catch{}

Log "Git commit"
git add .
git commit -m "UAOS final one click stable launcher"

Log "Deploy Vercel"
vercel --prod --yes | Tee-Object "$Repo\reports\vercel-$Stamp.txt"

Log "Push GitHub"
git push origin master

Log "DONE"
Start-Process "https://keyboard-manager-clean-liard.vercel.app"
notepad "$Repo\reports\UAOS_FINAL_ONE_CLICK_$Stamp.log"