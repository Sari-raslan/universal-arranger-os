$ErrorActionPreference = "Stop"
$Root = "C:\Users\ssare\keyboard-manager-clean"
$Frontend = "$Root\frontend"
$Live = "https://sari-raslan.github.io/universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Report = "$Root\reports\UAOS_MODULE_UI_REPORT_$Stamp.md"

function W($path,$text){
  $dir = Split-Path $path -Parent
  if($dir){ New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($path,$text,[System.Text.Encoding]::UTF8)
}

Set-Location $Root
if(git status --porcelain){ throw "STOP: Git not clean." }

W "$Frontend\src\main.jsx" 'import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const modules = [
  ["Runtime Agent","Playing, tempo, chord and section state.","runtime/src/UaosRuntime.js"],
  ["MIDI Agent","MIDI notes, CC, program change router.","midi-router/src/MidiRouter.js"],
  ["Sampler Agent","Feel sampler selection by note, velocity, articulation and maqam.","sampler-engine/src/feelSampler.js"],
  ["Keyboard Runtime Agent","Keyboard profiles and pack loading foundation.","keyboard-runtime/src/KeyboardRuntime.js"],
  ["Pack System Agent",".uaos-pack validation and manifest direction.","pack-system/src/UaosPack.js"],
  ["Library Manager Agent","Oriental expansion and future library catalog.","library-manager/src/LibraryManager.js"],
  ["AI/Ollama Planner Agent","Safe local planning scaffold with manual review.","ai-features/src/AiMission.js"],
  ["Desktop/Android Agent","Packaging notes for desktop and Android.","desktop-packaging / android-packaging"],
  ["QA Agent","Build, Pages, payments, mobile and runtime checklist.","qa/src/qaChecklist.js"]
];

function App(){
  return React.createElement("main",{className:"page"},
    React.createElement("section",{className:"hero"},
      React.createElement("h1",null,"UAOS"),
      React.createElement("h2",null,"Universal Arranger OS — Module UI"),
      React.createElement("p",null,"Agents are scaffolded and visible as product modules. This is the safe next layer before wiring real runtime behavior."),
      React.createElement("div",{className:"actions"},
        React.createElement("a",{href:"./launch/payment.html"},"Premium"),
        React.createElement("a",{href:"./status-ar.html"},"Arabic Status"),
        React.createElement("a",{href:"#modules"},"Modules")
      )
    ),
    React.createElement("section",{id:"modules",className:"grid"},
      modules.map(([title,desc,path]) =>
        React.createElement("article",{className:"card",key:title},
          React.createElement("h3",null,title),
          React.createElement("p",null,desc),
          React.createElement("code",null,path),
          React.createElement("span",{className:"badge"},"SAFE SCAFFOLD")
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));'

W "$Frontend\src\style.css" 'body{margin:0;background:#020617;color:white;font-family:Arial,sans-serif}.page{min-height:100vh;padding:42px;background:linear-gradient(135deg,#020617,#07111f,#0f172a)}.hero{max-width:1100px;margin:0 auto 32px}.hero h1{font-size:72px;margin:0;color:#22d3ee}.hero h2{font-size:34px;margin:8px 0;color:#e0f2fe}.hero p{font-size:20px;line-height:1.6;color:#cbd5e1;max-width:900px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.actions a{padding:14px 20px;border-radius:12px;background:linear-gradient(90deg,#2563eb,#06b6d4);color:white;text-decoration:none;font-weight:bold}.grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{border:1px solid rgba(34,211,238,.35);border-radius:18px;padding:22px;background:rgba(15,23,42,.8)}.card h3{color:#67e8f9;margin:0 0 10px}.card p{color:#cbd5e1;line-height:1.5}.card code{display:block;color:#93c5fd;background:#020617;padding:8px;border-radius:8px;font-size:13px;overflow:auto}.badge{display:inline-block;margin-top:14px;font-size:12px;padding:6px 9px;border-radius:999px;background:#064e3b;color:#86efac}'

@"
# UAOS Module UI Report

Time:
$(Get-Date)

Done:
- Rebuilt React Module UI
- Added visual cards for all safe agents
- Kept Premium and Arabic Status links
- No Vercel
- No startup
- No loop
- GitHub Pages publish only

Live:
$Live
"@ | Out-File $Report -Encoding UTF8

npm run build --prefix frontend
if($LASTEXITCODE -ne 0){ throw "BUILD FAILED" }

Remove-Item docs -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Frontend\dist" docs -Recurse -Force
New-Item docs\.nojekyll -ItemType File -Force | Out-Null
Copy-Item docs\index.html docs\404.html -Force

git add frontend/src/main.jsx frontend/src/style.css docs reports
git commit -m "Add UAOS module UI for safe agents"
git push

Start-Process "$Live/?v=$(Get-Date -Format yyyyMMddHHmmss)"
git status
