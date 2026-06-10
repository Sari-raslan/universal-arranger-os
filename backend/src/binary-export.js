export function binaryExportPlan(target, project = {}) {
  return {
    ok:true,
    target,
    status:"binary-export-foundation",
    warning:"Native binary writer still requires real format implementation.",
    project
  };
}
