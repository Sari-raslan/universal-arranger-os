$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Frontend="$Repo\frontend"
$Report="$Repo\reports\UAOS_DESKTOP_OFFLINE_FULL_RUN.txt"
$Url="http://127.0.0.1:5180"

New-Item -ItemType Directory -Force "$Repo\reports","$Repo\scripts" | Out-Null

"UAOS DESKTOP OFFLINE FULL RUN" | Set-Content $Report -Encoding UTF8
"TIME: $(Get-Date)" | Out-File $Report -Append

function Step($x){
  Write-Host "`n===== $x =====" -ForegroundColor Cyan
  "`n===== $x =====" | Out-File $Report -Append
}

Step "STOP OLD NODE"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

Step "BUILD FRONTEND"
cd $Repo
npm run build 2>&1 | Tee-Object -FilePath $Report -Append
if($LASTEXITCODE -ne 0){
  "BUILD: FAIL" | Out-File $Report -Append
  notepad $Report
  exit 1
}

Step "START BACKEND"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev"
Start-Sleep 5

Step "START FRONTEND PREVIEW"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Frontend'; npx vite preview --host 127.0.0.1 --port 5180 --strictPort"
Start-Sleep 6

Step "CHECK BACKEND"
try {
  $b=Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing -TimeoutSec 10
  "BACKEND: PASS $($b.StatusCode)" | Out-File $Report -Append
} catch {
  "BACKEND: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

Step "CHECK FRONTEND"
try {
  $f=Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 10
  "FRONTEND: PASS $($f.StatusCode)" | Out-File $Report -Append
} catch {
  "FRONTEND: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

Step "CREATE DESKTOP SHORTCUT"
$ShortcutPath="$env:USERPROFILE\Desktop\UAOS HyperStation Offline.lnk"
$WshShell=New-Object -ComObject WScript.Shell
$Shortcut=$WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath="chrome.exe"
$Shortcut.Arguments="--app=$Url --new-window"
$Shortcut.WorkingDirectory=$Repo
$Shortcut.IconLocation="chrome.exe,0"
$Shortcut.Save()

"DESKTOP SHORTCUT: $ShortcutPath" | Out-File $Report -Append

Step "OPEN UAOS DESKTOP"
Start-Process $ShortcutPath

Step "FINAL"
@"
STATUS:
Build checked.
Backend started.
Frontend preview started.
Desktop shortcut created.
Offline app opened.

URL:
$Url

CHECKLIST:
- Start / Stop
- Tempo
- Sections
- Maqam
- Backend Check
- PASS / FAIL
- Download Report
"@ | Out-File $Report -Append

notepad $Report
