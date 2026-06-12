Write-Host "[MIDI AGENT] START" -ForegroundColor Cyan

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Set-Location $App

$MidiFile=".\src\midi-status.json"

@"
{
  "webmidi": true,
  "electronBridge": true,
  "capture": "foundation",
  "routing": "planned"
}
"@ | Set-Content $MidiFile -Encoding UTF8

Write-Host "[MIDI AGENT] MIDI foundation updated" -ForegroundColor Green
