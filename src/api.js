export const API_BASE = import.meta.env.VITE_UAOS_API || "http://localhost:8080";
export const WS_BASE = import.meta.env.VITE_UAOS_WS || "ws://localhost:8080";

async function get(path){
  try { const r = await fetch(`${API_BASE}${path}`); return await r.json(); }
  catch { return { ok:false, offline:true }; }
}
async function post(path, body={}){
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    return await r.json();
  } catch { return { ok:false, offline:true }; }
}

export const apiHealth = () => get("/health");
export const getDevices = () => get("/devices");
export const getSequencer = () => get("/sequencer");
export const getMixer = () => get("/mixer");
export const exportProject = () => get("/export");

export const sendState = update => post("/state", update);
export const detectChord = notes => post("/chord", { notes });
export const playStyle = style => post("/style/play", { style });
export const stopStyle = () => post("/style/stop", {});
export const recStart = () => post("/rec/start", {});
export const recStop = () => post("/rec/stop", {});
export const seqToggle = (track, step) => post("/sequencer/toggle", { track, step });
export const mixerSet = (name, patch) => post("/mixer", { name, patch });