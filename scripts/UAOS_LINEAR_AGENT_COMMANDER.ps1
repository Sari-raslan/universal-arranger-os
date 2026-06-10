$ErrorActionPreference="Continue"

$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force agent-output,reports,src-engine,src-engine\midi,src-engine\chords,src-engine\arranger,src-engine\sampler,src-engine\agents | Out-Null

function W($p,$t){
Set-Content -Path (Join-Path $Repo $p) -Value $t -Encoding UTF8
}

function Log($m){
$l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
Write-Host $l
Add-Content "$Repo\reports\UAOS_LINEAR_AGENT_$Stamp.log" $l
}

Log "UAOS LINEAR AGENT COMMANDER START"

$Tasks=@(
@{id="UAOS-MIDI";title="Build MIDI runtime foundation";file="src-engine/midi/midi-runtime.js"},
@{id="UAOS-CHORD";title="Build chord detection engine";file="src-engine/chords/chord-engine.js"},
@{id="UAOS-ARRANGER";title="Build arranger state engine";file="src-engine/arranger/arranger-engine.js"},
@{id="UAOS-SAMPLER";title="Build sampler foundation";file="src-engine/sampler/sampler-core.js"},
@{id="UAOS-AGENTS";title="Build Linear/Codex agent queue";file="src-engine/agents/linear-agent.js"}
)

$Tasks | ConvertTo-Json -Depth 5 | Set-Content "$Repo\agent-output\linear-task-queue.json" -Encoding UTF8

W "src-engine\midi\midi-runtime.js" "export const midiRuntime={devices:[],status:`"foundation`",scan(){return {ok:true,devices:this.devices,note:`"Native USB/WebMIDI bridge next`"}}};"

W "src-engine\chords\chord-engine.js" "export function detectChord(notes=[]){const names=[`"C`",`"C#`",`"D`",`"D#`",`"E`",`"F`",`"F#`",`"G`",`"G#`",`"A`",`"A#`",`"B`"];const pcs=[...new Set(notes.map(n=>Number(n)%12))].sort((a,b)=>a-b);for(const r of pcs){const x=pcs.map(n=>(n-r+12)%12);if(x.includes(0)&&x.includes(4)&&x.includes(7))return names[r]+`" Major`";if(x.includes(0)&&x.includes(3)&&x.includes(7))return names[r]+`" Minor`";}return `"Unknown`";}"

W "src-engine\arranger\arranger-engine.js" "export class ArrangerEngine{constructor(){this.section=`"Stop`";this.sections=[`"Intro`",`"Main A`",`"Main B`",`"Main C`",`"Main D`",`"Fill`",`"Break`",`"Ending`"]}trigger(section){this.section=section;return {ok:true,section,state:`"accepted`",time:Date.now()}}}"

W "src-engine\sampler\sampler-core.js" "export const samplerCore={status:`"foundation`",layers:[],articulations:[`"normal`",`"legato`",`"staccato`"],rule:`"original or licensed samples only`"};"

W "src-engine\agents\linear-agent.js" "export const linearAgent={leader:`"Linear`",helpers:[`"Codex`",`"VS Code`",`"GitHub`"],mode:`"task-to-code-queue`"};"

$Prompt = `"CODEX NEXT TASKS - UAOS`r`n1. Connect modules to backend APIs.`r`n2. Add MIDI bridge.`r`n3. Add arranger engine.`r`n4. Add sampler engine.`r`n5. Build before commit.`"

W "agent-output\CODEX_NEXT_TASKS.md" $Prompt

Log "INSTALL + BUILD"

npm install --prefix backend
npm install --prefix uaos-live-clean
npm run build --prefix uaos-live-clean

Log "GIT"

git add .
git commit -m `"Add UAOS Linear agent commander modules`"

git push origin master

Log "DONE"

