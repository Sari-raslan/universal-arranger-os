$ErrorActionPreference="Continue"

$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Report="agent-output\UAOS_ALL_AGENTS_DESKTOP_MASTER_REPORT.md"
"# UAOS ALL AGENTS DESKTOP MASTER`nGenerated: $(Get-Date)`n" | Set-Content $Report -Encoding UTF8

function Log($m){
  $m | Tee-Object -FilePath $Report -Append
}

function HasCmd($c){
  return [bool](Get-Command $c -ErrorAction SilentlyContinue)
}

Log "## 1. Environment"
Log "Root: $Root"
Log "User: $env:USERNAME"
Log "Computer: $env:COMPUTERNAME"

$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Log "LAN IP: $LocalIP"

Log "`n## 2. Tool check"
foreach($tool in @("git","node","npm","vercel","code")){
  if(HasCmd $tool){ Log "$tool : FOUND" } else { Log "$tool : MISSING" }
}

Log "`n## 3. Stop old local servers"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Log "`n## 4. Git sync"
git status 2>&1 | Tee-Object -FilePath $Report -Append
git pull origin master 2>&1 | Tee-Object -FilePath $Report -Append

Log "`n## 5. Install dependencies"
npm run setup 2>&1 | Tee-Object -FilePath $Report -Append

Log "`n## 6. Build frontend"
npm run build --prefix uaos-live-clean 2>&1 | Tee-Object -FilePath $Report -Append
if($LASTEXITCODE -ne 0){
  Log "BUILD FAILED. Stop."
  notepad $Report
  exit 1
}

Log "`n## 7. Start local backend if available"
if(Test-Path "backend\server.js"){
  Start-Process powershell -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$Root`"; npm run dev"
  )
  Start-Sleep 3
} else {
  Log "No backend\server.js found. Skipping local backend."
}

Log "`n## 8. Start local frontend"
Start-Process powershell -WindowStyle Minimized -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$Root\uaos-live-clean`"; npm run preview"
)
Start-Sleep 5

Log "`n## 9. Local QA"
$LocalChecks=@(
  "http://127.0.0.1:5180",
  "http://127.0.0.1:5199/health"
)

foreach($u in $LocalChecks){
  try{
    $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 5
    Log "$u PASS $($r.StatusCode)"
  }catch{
    Log "$u FAIL $($_.Exception.Message)"
  }
}

Log "`n## 10. Commit current work"
git add . 2>&1 | Tee-Object -FilePath $Report -Append
git commit -m "UAOS all agents desktop master update" 2>&1 | Tee-Object -FilePath $Report -Append
git push origin master 2>&1 | Tee-Object -FilePath $Report -Append

Log "`n## 11. Vercel deploy"
if(HasCmd "vercel"){
  vercel --prod --yes 2>&1 | Tee-Object -FilePath $Report -Append
}else{
  Log "vercel CLI missing. Skipping deploy."
}

Log "`n## 12. Public QA"
$PublicChecks=@(
  "https://universal-arranger-os.vercel.app",
  "https://universal-arranger-os.vercel.app/api/status",
  "https://universal-arranger-os.vercel.app/api/presets",
  "https://universal-arranger-os.vercel.app/api/release-report"
)

foreach($u in $PublicChecks){
  try{
    $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
    Log "$u PASS $($r.StatusCode)"
  }catch{
    Log "$u FAIL $($_.Exception.Message)"
  }
}

Log "`n## 13. Desktop app"
if(Test-Path "desktop\package.json"){
  Push-Location desktop
  npm install 2>&1 | Tee-Object -FilePath "..\$Report" -Append
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$Root\desktop`"; npm run start"
  )
  Pop-Location
  Log "Desktop app start attempted."
}else{
  Log "desktop\package.json missing."
}

Log "`n## 14. Mobile prep"
if(Test-Path "mobile\package.json"){
  Push-Location mobile
  npm install 2>&1 | Tee-Object -FilePath "..\$Report" -Append
  Pop-Location
  Log "Mobile dependencies prepared."
}else{
  Log "mobile\package.json missing."
}

Log "`n## 15. Open agent apps if available"
if(HasCmd "code"){
  Start-Process code $Root
  Log "VS Code opened."
}

$PossibleCodex=@(
  "$HOME\AppData\Local\Programs\Codex\Codex.exe",
  "$HOME\AppData\Local\Programs\OpenAI Codex\Codex.exe"
)

foreach($p in $PossibleCodex){
  if(Test-Path $p){
    Start-Process $p
    Log "Codex opened: $p"
  }
}

Log "`n## 16. Final links"
@"
# UAOS FINAL LINKS

Public Web:
https://universal-arranger-os.vercel.app

Public API:
https://universal-arranger-os.vercel.app/api/status
https://universal-arranger-os.vercel.app/api/presets
https://universal-arranger-os.vercel.app/api/release-report

Local:
http://127.0.0.1:5180
http://127.0.0.1:5199/health

LAN:
http://$LocalIP`:5180
http://$LocalIP`:5199/health

Desktop:
cd desktop
npm install
npm run start

Android:
cd mobile
npm install
npm run init
npm run add-android
npm run sync
npm run android

iPhone:
Requires macOS + Xcode:
cd mobile
npm run add-ios
npm run sync
npm run ios
"@ | Set-Content "release-kit\UAOS_FINAL_ALL_LINKS_AND_COMMANDS.md" -Encoding UTF8

Log "Final links written: release-kit\UAOS_FINAL_ALL_LINKS_AND_COMMANDS.md"

Start-Process "https://universal-arranger-os.vercel.app"
Start-Process "https://universal-arranger-os.vercel.app/api/status"
notepad $Report
notepad "release-kit\UAOS_FINAL_ALL_LINKS_AND_COMMANDS.md"

Log "`n## DONE"
