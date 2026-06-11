$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Report="reports\UAOS_V1_LOCAL_VERIFY_$Stamp.txt"

"UAOS V1 LOCAL VERIFY" | Tee-Object -FilePath $Report
"Time: $(Get-Date)" | Tee-Object -FilePath $Report -Append

npm install --prefix uaos-live-clean | Tee-Object -FilePath $Report -Append
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Report -Append

"Git status:" | Tee-Object -FilePath $Report -Append
git status | Tee-Object -FilePath $Report -Append

notepad $Report
