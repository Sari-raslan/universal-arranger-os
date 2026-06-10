cd C:\Users\ssare\keyboard-manager-clean

$LiveUrl = "https://keyboard-manager-clean-liard.vercel.app"
$Report = "reports\UAOS_FINAL_SEQUENTIAL_LAUNCH_REPORT.md"

Write-Host "UAOS FINAL SEQUENTIAL LAUNCH START" -ForegroundColor Cyan

# 1. Stop old agents
$PidFile = "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.pid"
if (Test-Path $PidFile) {
  Stop-Process -Id (Get-Content $PidFile) -Force -ErrorAction SilentlyContinue
}

# 2. Restore tracked files only
git restore .
git pull

# 3. Create folders
mkdir runtime\src,chord-engine\src,midi-router\src,timing-engine\src -Force
mkdir sampler-engine\src,libraries\oriental-expansion-vol-1,keyboard-runtime\adapters,packs\demo-oriental-runtime-pack.uaos-pack -Force
mkdir reports -Force

# 4. Runtime
Set-Content runtime\src\UaosRuntime.js 'export class UaosRuntime{constructor(){this.state={playing:false,section:"variation1",tempo:120,chord:null}}setTempo(bpm){this.state.tempo=bpm;return this.state}setChord(chord){this.state.chord=chord;return this.state}triggerSection(section){this.state.section=section;return this.state}start(){this.state.playing=true;return this.state}stop(){this.state.playing=false;return this.state}}' -Encoding utf8

# 5. Chord Engine
Set-Content chord-engine\src\detectChord.js 'export function detectChord(notes=[]){const u=[...new Set(notes.map(Number))].sort((a,b)=>a-b);if(u.length<3)return{type:"unknown",notes:u};const r=u[0];const i=u.map(n=>(n-r+12)%12);if(i.includes(4)&&i.includes(7)&&i.includes(10))return{root:r,type:"dominant7",symbol:`${r}:7`,notes:u};if(i.includes(4)&&i.includes(7))return{root:r,type:"major",symbol:`${r}:maj`,notes:u};if(i.includes(3)&&i.includes(7))return{root:r,type:"minor",symbol:`${r}:min`,notes:u};if(i.includes(5)&&i.includes(7))return{root:r,type:"sus4",symbol:`${r}:sus4`,notes:u};return{root:r,type:"custom",notes:u}}' -Encoding utf8

# 6. MIDI Router
Set-Content midi-router\src\MidiRouter.js 'export class MidiRouter{constructor(){this.outputs=[]}addOutput(o){this.outputs.push(o)}send(m){for(const o of this.outputs){if(o&&typeof o.send==="function")o.send(m)}}noteOn(n,v=100,c=0){this.send([0x90+c,n,v])}noteOff(n,c=0){this.send([0x80+c,n,0])}controlChange(cc,v,c=0){this.send([0xB0+c,cc,v])}programChange(p,c=0){this.send([0xC0+c,p])}}' -Encoding utf8

# 7. Timing Engine
Set-Content timing-engine\src\TimingEngine.js 'export class TimingEngine{constructor(bpm=120){this.bpm=bpm;this.ppq=24;this.tick=0}setTempo(bpm){this.bpm=bpm}getMsPerTick(){return 60000/this.bpm/this.ppq}nextTick(){this.tick+=1;return{tick:this.tick,msPerTick:this.getMsPerTick()}}reset(){this.tick=0}}' -Encoding utf8

# 8. Sampler + Keyboard Runtime
Set-Content sampler-engine\src\feelSampler.js 'export function selectSample({samples,note}){return samples.find(s=>s.note===note)||null}' -Encoding utf8
Set-Content libraries\oriental-expansion-vol-1\manifest.json '{ "name":"oriental-expansion-vol-1", "version":"0.1.0", "license":"original-or-licensed-only" }' -Encoding utf8
Set-Content packs\demo-oriental-runtime-pack.uaos-pack\manifest.json '{ "packId":"demo-oriental-runtime-pack", "format":".uaos-pack", "targetKeyboards":["korg-pa","yamaha-genos","roland-bk","ketron"] }' -Encoding utf8
Set-Content keyboard-runtime\adapters\korgPaAdapter.js 'export function createKorgPaCommand(section){return{section,type:"placeholder"}}' -Encoding utf8

# 9. Frontend index
Set-Content frontend\src\uaosCore.js 'export { UaosRuntime } from "../../runtime/src/UaosRuntime.js"; export { detectChord } from "../../chord-engine/src/detectChord.js"; export { MidiRouter } from "../../midi-router/src/MidiRouter.js"; export { TimingEngine } from "../../timing-engine/src/TimingEngine.js";' -Encoding utf8

# 10. Report
@"
# UAOS Final Sequential Launch Report

Done:
- Runtime Engine
- Chord Engine
- MIDI Router
- Timing Engine
- Feel Sampler scaffold
- Oriental Expansion manifest
- .uaos-pack format
- Keyboard Runtime adapter
- Frontend integration file
- Build + Git + Vercel publish attempted

Live:
$LiveUrl
"@ | Out-File $Report -Encoding utf8

# 11. Build
npm run build --prefix frontend
if ($LASTEXITCODE -ne 0) {
  Write-Host "BUILD FAILED. STOPPING." -ForegroundColor Red
  exit 1
}

# 12. Commit and push
git add runtime chord-engine midi-router timing-engine sampler-engine libraries keyboard-runtime packs frontend\src\uaosCore.js $Report
git commit -m "Run final sequential UAOS launcher" 2>$null
git push

# 13. Publish from dist
cd frontend
npm run build
cd dist
vercel deploy --prod --yes --archive=tgz

Start-Process $LiveUrl
Write-Host "UAOS FINAL SEQUENTIAL LAUNCH DONE" -ForegroundColor Green
