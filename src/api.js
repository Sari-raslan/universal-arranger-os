$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root
$Report="reports\UAOS_PA3X_UI_CONTROL.txt"
New-Item -ItemType Directory -Force -Path reports | Out-Null
function Log($m){$x="[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"; Write-Host $x; Add-Content -LiteralPath $Report -Value $x -Encoding UTF8}

Log "UAOS PA3X UI CONTROL START"

@'
export const API_BASE = import.meta.env.VITE_UAOS_API || "http://localhost:8080";
export const BRIDGE_BASE = import.meta.env.VITE_UAOS_BRIDGE || "http://localhost:8090";

async function getUrl(url){ try{ const r=await fetch(url); return await r.json(); }catch{return {ok:false,offline:true}} }
async function postUrl(url,body={}){ try{ const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); return await r.json(); }catch{return {ok:false,offline:true}} }

export const apiHealth=()=>getUrl(`${API_BASE}/health`);
export const phase4Report=()=>getUrl(`${API_BASE}/phase4/report`);

export const bridgeHealth=()=>getUrl(`${BRIDGE_BASE}/health`);
export const bridgeScan=()=>getUrl(`${BRIDGE_BASE}/scan`);
export const bridgeOpen=()=>postUrl(`${BRIDGE_BASE}/open`,{});
export const bridgeNote=(note=60)=>postUrl(`${BRIDGE_BASE}/send`,{note,velocity:100,channel:0});
export const bridgeChord=(chord="CM")=>postUrl(`${BRIDGE_BASE}/chord`,{chord});
export const bridgeProgression=(name="oriental_pop")=>postUrl(`${BRIDGE_BASE}/progression`,{name,gap:900});
export const bridgeDemoSong=()=>postUrl(`${BRIDGE_BASE}/demo/song`,{});
export const bridgeStart=()=>postUrl(`${BRIDGE_BASE}/start`,{});
export const bridgeStop=()=>postUrl(`${BRIDGE_BASE}/stop`,{});
export const bridgeFill=()=>postUrl(`${BRIDGE_BASE}/fill`,{});
export const bridgeBreak=()=>postUrl(`${BRIDGE_BASE}/break`,{});
export const bridgePanic=()=>postUrl(`${BRIDGE_BASE}/panic`,{});
export const bridgeClockStart=(bpm=120)=>postUrl(`${BRIDGE_BASE}/clock/start`,{bpm});
export const bridgeClockStop=()=>postUrl(`${BRIDGE_BASE}/clock/stop`,{});
