const KEY = "uaos-project-v1";

export function saveProject(state){
  localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt:new Date().toISOString() }));
  return { ok:true };
}

export function loadProject(){
  try { return JSON.parse(localStorage.getItem(KEY)) || null; }
  catch { return null; }
}