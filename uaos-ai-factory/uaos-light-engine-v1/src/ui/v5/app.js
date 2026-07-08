const API = "http://localhost:3000";

function setText(id, txt){ const e=document.getElementById(id); if(e) e.textContent=txt; }

async function api(path, body){
  const res = await fetch(API + path, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: body ? JSON.stringify(body) : "{}"
  });
  return await res.json().catch(()=>({}));
}

async function refreshStatus(){
  try{
    const r = await fetch(API + "/api/v4/status");
    const j = await r.json();
    setText("conn","Connected");
    setText("engineStatus", j.bridge || j.status || "Ready");
  }catch{
    setText("conn","Server Off");
    setText("engineStatus","Start Engine");
  }
}

async function startEngine(){
  setText("conn","Starting...");
  await refreshStatus();
  alert("If status stays Server Off, launch with START_UAOS_LIGHT_ENGINE_SIMPLE.cmd so the server auto-starts.");
}

async function runScene(sceneId){
  try{
    const brightness = Number(document.getElementById("brightness")?.value || 80) / 100;
    const bpm = Number(document.getElementById("bpm")?.value || 120);
    await api("/api/v4/scene/run", {sceneId, brightness, bpm});
    setText("activeScene", sceneId);
    setText("conn","Connected");
  }catch(e){
    alert("Engine not reachable. Use Start Engine or reopen from the desktop launcher.");
    setText("conn","Server Off");
  }
}

async function runFavorite(slot){
  try{
    await api("/api/v4/favorites/run", {slot});
    setText("activeScene","Favorite " + slot);
  }catch{
    alert("Favorite not configured yet. Open Scene Studio in Advanced.");
  }
}

async function emergencyStop(){
  try{
    await api("/api/v4/emergency-stop", {});
    setText("activeScene","Emergency Stop");
    alert("Emergency Stop sent. All Hue lights should reset to safe warm white.");
  }catch{
    alert("Emergency Stop failed: server not reachable.");
  }
}

async function tapTempo(){
  try{
    const r = await api("/api/v4/bpm/tap", {});
    if(r.bpm){ document.getElementById("bpm").value = r.bpm; setText("bpmValue", r.bpm); }
  }catch{ alert("Tap tempo not reachable."); }
}

function showPanel(id){
  document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
  const p = document.getElementById(id);
  if(p) p.classList.remove("hidden");
}

function openAdvanced(){
  window.open(API + "/src/ui/v4/index.html", "_blank");
}

refreshStatus();
setInterval(refreshStatus, 5000);