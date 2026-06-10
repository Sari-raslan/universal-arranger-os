$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Frontend="$Repo\frontend"
$Url="http://127.0.0.1:5180"
$Report="$Repo\reports\UAOS_OPEN_OFFLINE_APP_FIXED.txt"

"UAOS OPEN OFFLINE APP FIXED" | Set-Content $Report -Encoding UTF8

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

cd $Repo
npm run build

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev"
Start-Sleep 5

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Frontend'; npx vite preview --host 127.0.0.1 --port 5180 --strictPort"
Start-Sleep 6

try {
  Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 10 | Out-Null
  "FRONTEND PASS" | Out-File $Report -Append
  Start-Process $Url
} catch {
  "FRONTEND FAIL: $($_.Exception.Message)" | Out-File $Report -Append
}

$ShortcutPath="$env:USERPROFILE\Desktop\UAOS HyperStation Offline.lnk"
$WshShell=New-Object -ComObject WScript.Shell
$Shortcut=$WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath="powershell.exe"
$Shortcut.Arguments="-ExecutionPolicy Bypass -File `"$Repo\scripts\UAOS_OPEN_OFFLINE_APP_FIXED.ps1`""
$Shortcut.WorkingDirectory=$Repo
$Shortcut.Save()

notepad $Report
