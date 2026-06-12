export function makeProjectSnapshot({timeline, arrangerState, midiProfiles}){
  return JSON.stringify({
    product:"UAOS",
    version:"1.14-project",
    exportedAt:new Date().toISOString(),
    timeline,
    arrangerState,
    midiProfiles
  }, null, 2);
}

export function loadProjectSnapshot(text){
  const data = JSON.parse(text);

  if(!data || data.product !== "UAOS"){
    throw new Error("Not a UAOS project file");
  }

  return data;
}
