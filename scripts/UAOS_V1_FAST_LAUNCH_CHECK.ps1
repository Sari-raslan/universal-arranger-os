$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Report="reports\UAOS_V1_FAST_LAUNCH_$Stamp.txt"

"UAOS V1 FAST LAUNCH CHECK" | Tee-Object -FilePath $Report
"Root: $Root" | Tee-Object -FilePath $Report -Append
"Time: $(Get-Date)" | Tee-Object -FilePath $Report -Append

if(Test-Path package.json){
  "Root package.json found" | Tee-Object -FilePath $Report -Append
  npm install | Tee-Object -FilePath $Report -Append
} else {
  "No root package.json found" | Tee-Object -FilePath $Report -Append
}

if(Test-Path frontend){
  Set-Location "$Root\frontend"
  "Frontend found" | Tee-Object -FilePath $Report -Append

  if(Test-Path package.json){
    npm install | Tee-Object -FilePath $Report -Append
    npm run build | Tee-Object -FilePath $Report -Append
  }

  Set-Location $Root
}

git status | Tee-Object -FilePath $Report -Append

"NEXT COMMANDS:" | Tee-Object -FilePath $Report -Append
'powershell -ExecutionPolicy Bypass -File ".\scripts\UAOS_V1_FAST_LAUNCH_CHECK.ps1"' | Tee-Object -FilePath $Report -Append

notepad $Report
