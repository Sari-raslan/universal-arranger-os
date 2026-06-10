$ErrorActionPreference = "Continue"

$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Reports = "$Root\reports"
New-Item -ItemType Directory -Force -Path $Reports | Out-Null
$Log = "$Reports\UAOS_PHASE3_FINAL_FIX_AND_CHECK.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

cd $Root
Log "UAOS PHASE3 FINAL FIX START"

Log "1. Ensure exporter files are valid JS"

@'
export function exportMidiDraft(project){
  const song = project?.song?.song || [];
  let time = 0;
  const events = [];

  for (const part of song) {
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
