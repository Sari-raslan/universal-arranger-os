export const API_BASE = import.meta.env.VITE_UAOS_API || "http://localhost:8080";
export const WS_BASE = import.meta.env.VITE_UAOS_WS || "ws://localhost:8080";
export const BRIDGE_BASE = import.meta.env.VITE_UAOS_BRIDGE || "http://localhost:8090";

async function getUrl(url){
  try { const r = await fetch(url); return await r.json(); }
  catch { return { ok:false, offline:true }; }
}

async function postUrl(url, body={}){
  try {
    const r = await fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    return await r.json();
  } catch { return { ok:false, offline:true }; }
}

async function get(path){ return getUrl(`${API_BASE}${path}`); }
async function post(path, body={}){ return postUrl(`${API_BASE}${path}`, body); }

export const apiHealth = () => get("/health");
export const diagnostics = () => get("/diagnostics");
export const getDevices = () => get("/devices");
export const getSequencer = () => get("/sequencer");
export const getMixer = () => get("/mixer");
export const getSong = () => get("/song");
export const exportProject = () => get("/export");
export const exportMidi = () => get("/export/midi");
export const exportStyle = target => get(`/export/style/${target}`);

export const sendState = update => post("/state", update);
export const detectChord = notes => post("/chord", { notes });
export const playStyle = style => post("/style/play", { style });
export const stopStyle = () => post("/style/stop", {});
export const recStart = () => post("/rec/start", {});
export const recStop = () => post("/rec/stop", {});
export const seqToggle = (track, step) => post("/sequencer/toggle", { track, step });
export const mixerSet = (name, patch) => post("/mixer", { name, patch });
export const generateSong = style => post("/song/generate", { style });

export const bridgeHealth = () => getUrl(`${BRIDGE_BASE}/health`);
export const bridgeScan = () => getUrl(`${BRIDGE_BASE}/scan`);
export const bridgeSendNote = (note=60, velocity=100, channel=1) =>
  postUrl(`${BRIDGE_BASE}/send`, { type:"note", note, velocity, channel });
export const bridgePanic = () => postUrl(`${BRIDGE_BASE}/panic`, {});
