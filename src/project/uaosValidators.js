export function validateUAOSProject(project){
  const errors=[];
  const warnings=[];

  if(!project) errors.push("Project is empty");
  if(project?.product!=="UAOS") errors.push("Not a UAOS project");
  if(!project?.timeline && !project?.events) warnings.push("No timeline/events found");
  if(project?.arrangerState && !project.arrangerState.bpm) warnings.push("No BPM in arranger state");
  if(project?.arrangerState && !project.arrangerState.chord) warnings.push("No chord in arranger state");

  return {
    ok:errors.length===0,
    errors,
    warnings
  };
}

export function validateUAOSStyle(style){
  const errors=[];
  const warnings=[];

  if(!style) errors.push("Style is empty");
  if(style?.product!=="UAOS") errors.push("Not a UAOS style");
  if(!style?.patterns) errors.push("No patterns found");
  if(!style?.sectionMemory) warnings.push("No section memory found");
  if(!style?.bpm) warnings.push("No BPM found");

  return {
    ok:errors.length===0,
    errors,
    warnings
  };
}
