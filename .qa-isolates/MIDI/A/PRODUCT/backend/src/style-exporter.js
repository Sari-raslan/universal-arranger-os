export function exportStyleDraft(project, target="generic"){
  return {
    ok: true,
    target,
    warning: "Draft exporter. Native binary export comes later.",
    style: {
      name: project?.state?.style || "UAOS Style",
      tempo: project?.state?.tempo || 120,
      chord: project?.state?.chord || "Cm",
      song: project?.song?.song || [],
      mixer: project?.mixer?.tracks || [],
      sequencer: project?.sequencer?.steps || []
    }
  };
}
