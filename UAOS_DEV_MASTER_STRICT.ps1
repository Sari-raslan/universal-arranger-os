$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Reports="$Root\reports"
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$MasterLog="$Reports\UAOS_DEV_MASTER_STRICT_$Stamp.txt"

function L($m){
  $x="[MASTER] $m"
  Write-Host $x -ForegroundColor Cyan
  $x | Out-File -LiteralPath $MasterLog -Append -Encoding utf8
}

function RunAgent($Name,$Path){
  L "RUN $Name"
  powershell -ExecutionPolicy Bypass -File $Path
  if($LASTEXITCODE -ne 0){
    L "FAIL $Name"
    notepad $MasterLog
    exit 1
  }
  L "PASS $Name"
}

L "UAOS STRICT DEV MASTER START"

RunAgent "AUDIO_AGENT" ".\scripts\agents\AUDIO_AGENT_REAL.ps1"
RunAgent "MIDI_AGENT" ".\scripts\agents\MIDI_AGENT_REAL.ps1"
RunAgent "BUILD_AGENT" ".\scripts\agents\BUILD_AGENT_STRICT.ps1"
RunAgent "DEPLOY_AGENT" ".\scripts\agents\DEPLOY_AGENT_SAFE.ps1"
RunAgent "WATCH_AGENT" ".\scripts\agents\WATCH_AGENT_FULL.ps1"

L "UAOS STRICT DEV MASTER DONE"
Start-Process "https://universal-arranger-os.vercel.app"
notepad $MasterLog
