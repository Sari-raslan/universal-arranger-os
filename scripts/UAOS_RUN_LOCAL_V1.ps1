$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
Set-Location $Root

New-Item -ItemType Directory -Force scripts,reports,agent-output | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Report="reports\UAOS_MASTER_FINAL_V1_$Stamp.txt"

function Log($m){
  $m | Tee-Object -FilePath $Report -Append
}

Log "UAOS MASTER FINAL V1 LAUNCHER"
Log "Time: $(Get-Date)"
Log "Root: $Root"

Log "`n=== FIX .GITIGNORE ==="
@"
node_modules/
dist/
build/
.vite/
.vercel/
.gradle/
agents/reports/
agent-output/*.log
reports/*.txt
reports/*.log
*.apk
*.aab
*.ipa
*.exe
*.msi
*.zip
*.7z
.DS_Store
Thumbs.db
"@ | Set-Content ".gitignore" -Encoding UTF8

Log "`n=== FIX LOCAL RUN SCRIPT ==="
@'
$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location "$Root\uaos-live-clean"
npm run dev -- --host 127.0.0.1 --port 5173
