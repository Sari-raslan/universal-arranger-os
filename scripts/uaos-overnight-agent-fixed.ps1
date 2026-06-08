Set-Location "C:\Users\ssare\keyboard-manager-clean"
"$(Get-Date) | UAOS overnight agent started" | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8

New-Item -ItemType Directory -Path "sampler-engine\src","libraries\oriental-expansion-vol-1","keyboard-runtime\adapters","packs\demo-oriental-runtime-pack.uaos-pack","reports","agent-output" -Force | Out-Null

Set-Content "sampler-engine\src\feelSampler.js" 'export function selectSample({ samples, note }) { return samples.find(s => s.note === note) || null }' -Encoding utf8
Set-Content "libraries\oriental-expansion-vol-1\manifest.json" '{ "name":"oriental-expansion-vol-1", "version":"0.1.0", "license":"original-or-licensed-only" }' -Encoding utf8
Set-Content "packs\demo-oriental-runtime-pack.uaos-pack\manifest.json" '{ "packId":"demo-oriental-runtime-pack", "format":".uaos-pack", "targetKeyboards":["korg-pa","yamaha-genos","roland-bk","ketron"] }' -Encoding utf8
Set-Content "keyboard-runtime\adapters\korgPaAdapter.js" 'export function createKorgPaCommand(section){ return { section, type:"placeholder" } }' -Encoding utf8
Set-Content "reports\OVERNIGHT_MISSIONS_REPORT.md" '# UAOS Overnight Missions Scaffold Done' -Encoding utf8

npm run build --prefix frontend 2>&1 | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8

if ($LASTEXITCODE -eq 0) {
  git add sampler-engine libraries keyboard-runtime packs reports\OVERNIGHT_MISSIONS_REPORT.md
  git commit -m "Scaffold UAOS overnight missions" 2>&1 | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8
  git push 2>&1 | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8
  "$(Get-Date) | build passed and pushed" | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8
} else {
  "$(Get-Date) | build failed no push" | Out-File "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.log" -Append -Encoding utf8
}
