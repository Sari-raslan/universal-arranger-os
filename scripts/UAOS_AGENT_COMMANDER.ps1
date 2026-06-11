$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Report="agents/reports/UAOS_AGENT_COMMANDER_$Stamp.txt"

"UAOS AGENT COMMANDER" | Tee-Object -FilePath $Report
"Root: $Root" | Tee-Object -FilePath $Report -Append
"Time: $(Get-Date)" | Tee-Object -FilePath $Report -Append
"" | Tee-Object -FilePath $Report -Append

"=== AGENT TASK FILES ===" | Tee-Object -FilePath $Report -Append
Get-ChildItem agents/tasks/*.md | ForEach-Object {
  "TASK: $($_.Name)" | Tee-Object -FilePath $Report -Append
}

"" | Tee-Object -FilePath $Report -Append
"=== GIT STATUS ===" | Tee-Object -FilePath $Report -Append
git status | Tee-Object -FilePath $Report -Append

"" | Tee-Object -FilePath $Report -Append
"=== BUILD CHECK ===" | Tee-Object -FilePath $Report -Append

if(Test-Path package.json){
  "Root package.json found" | Tee-Object -FilePath $Report -Append
  npm install | Tee-Object -FilePath $Report -Append
  npm run build | Tee-Object -FilePath $Report -Append
} elseif(Test-Path frontend/package.json){
  "Frontend package.json found" | Tee-Object -FilePath $Report -Append
  Set-Location "$Root/frontend"
  npm install | Tee-Object -FilePath $Report -Append
  npm run build | Tee-Object -FilePath $Report -Append
  Set-Location $Root
} else {
  "No package.json found" | Tee-Object -FilePath $Report -Append
}

"" | Tee-Object -FilePath $Report -Append
"=== NEXT HUMAN/CHATGPT ACTION ===" | Tee-Object -FilePath $Report -Append
"Send this report result back to ChatGPT to decide the next code patch." | Tee-Object -FilePath $Report -Append

notepad $Report
