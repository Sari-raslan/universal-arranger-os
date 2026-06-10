$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

Write-Host "UAOS REAL ENGINE CONTINUE..." -ForegroundColor Cyan

# 1. Fix backend exports
@'
export function exportMidiDraft(project){
  const song = project?.song?.song || [];
  let time = 0;
  const events = [];

  for(const part of song){
    events.push({
      time,
      type: "section",
      section: part.section,
      chord: part.chord,
      bars: part.bars
    });
    time += (part.bars || 1) * 4;
  }

  return {
    ok: true,
    format: "uaos-midi-draft-json",
    ppq: 480,
    tempo: project?.state?.tempo || 120,
    events
  };
}
