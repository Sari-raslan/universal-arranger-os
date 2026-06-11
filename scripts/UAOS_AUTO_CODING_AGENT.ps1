$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
Set-Location $Root
New-Item -ItemType Directory -Force agent-output,agents/tasks,reports | Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="agent-output\UAOS_AUTO_CODING_AGENT_$Stamp.log"
function L($m){ $m | Tee-Object -FilePath $Log -Append }
L "UAOS AUTO CODING AGENT"
L "Time: $(Get-Date)"
L "Task: sound library + build check"
$SoundDoc="agents/tasks/SOUND_LIBRARY_AGENT_TASKS.md"
$SoundText="# SOUND LIBRARY AGENT TASKS`n`nV1:`n- Sound library page`n- Oriental / Gulf / Turkish / Western cards`n- Sampler placeholder`n- Voice upload placeholder`n`nV2:`n- Velocity layers`n- Round robin`n- Articulations`n- Human feel modeling`n- UAOS sampler engine"
$SoundText | Set-Content $SoundDoc -Encoding UTF8
L "Sound library task file written."
L "=== BUILD ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -eq 0) {
  L "Build OK. Commit safe files."
  git add agents/tasks/SOUND_LIBRARY_AGENT_TASKS.md
  git add scripts/UAOS_AUTO_CODING_AGENT.ps1
  git commit -m "Add UAOS auto coding agent sound library tasks" 2>&1 | Tee-Object -FilePath $Log -Append
} else {
  L "Build failed. No commit."
}
L "=== STATUS ==="
git status | Tee-Object -FilePath $Log -Append
notepad $Log
