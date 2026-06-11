$ErrorActionPreference="Continue"

$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Log="agent-output\UAOS_AUTO_UPDATE_AFTER_RESTART.log"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" |
    Tee-Object -FilePath $Log -Append
}

Log "===== UAOS AUTO UPDATE START ====="

try{
  Log "Stopping old node..."
  Get-Process node -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
}catch{}

Log "Git pull..."
git pull origin master 2>&1 |
  Tee-Object -FilePath $Log -Append

Log "Install deps..."
npm install 2>&1 |
  Tee-Object -FilePath $Log -Append

if(Test-Path "uaos-live-clean\package.json"){
  Log "Build web..."
  npm run build --prefix uaos-live-clean 2>&1 |
    Tee-Object -FilePath $Log -Append
}

if(Test-Path "desktop\package.json"){
  Log "Desktop install..."
  Push-Location desktop
  npm install 2>&1 |
    Tee-Object -FilePath "..\$Log" -Append

  Log "Build desktop..."
  npm run pack 2>&1 |
    Tee-Object -FilePath "..\$Log" -Append

  Pop-Location
}

Log "Deploy Vercel..."
vercel --prod --yes 2>&1 |
  Tee-Object -FilePath $Log -Append

$Checks=@(
  "https://universal-arranger-os.vercel.app",
  "https://universal-arranger-os.vercel.app/api/status"
)

foreach($u in $Checks){
  try{
    $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20
    Log "$u PASS $($r.StatusCode)"
  }catch{
    Log "$u FAIL $($_.Exception.Message)"
  }
}

$DesktopExe = Get-ChildItem "$Root\desktop\dist" -Filter "*.exe" -File -ErrorAction SilentlyContinue |
  Where-Object { $ErrorActionPreference="Continue"

$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Log="agent-output\UAOS_AUTO_UPDATE_AFTER_RESTART.log"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" |
    Tee-Object -FilePath $Log -Append
}

Log "===== UAOS AUTO UPDATE START ====="

try{
  Log "Stopping old node..."
  Get-Process node -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
}catch{}

Log "Git pull..."
git pull origin master 2>&1 |
  Tee-Object -FilePath $Log -Append

Log "Install deps..."
npm install 2>&1 |
  Tee-Object -FilePath $Log -Append

if(Test-Path "uaos-live-clean\package.json"){
  Log "Build web..."
  npm run build --prefix uaos-live-clean 2>&1 |
    Tee-Object -FilePath $Log -Append
}

if(Test-Path "desktop\package.json"){
  Log "Desktop install..."
  Push-Location desktop
  npm install 2>&1 |
    Tee-Object -FilePath "..\$Log" -Append

  Log "Build desktop..."
  npm run pack 2>&1 |
    Tee-Object -FilePath "..\$Log" -Append

  Pop-Location
}

Log "Deploy Vercel..."
vercel --prod --yes 2>&1 |
  Tee-Object -FilePath $Log -Append

$Checks=@(
  "https://universal-arranger-os.vercel.app",
  "https://universal-arranger-os.vercel.app/api/status"
)

foreach($u in $Checks){
  try{
    $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20
    Log "$u PASS $($r.StatusCode)"
  }catch{
    Log "$u FAIL $($_.Exception.Message)"
  }
}

$DesktopExe=Get-ChildItem "$Root\desktop\dist" -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if($DesktopExe){
  Log "Launching desktop EXE..."
  Start-Process $DesktopExe.FullName
}

Start-Process "https://universal-arranger-os.vercel.app"

Log "===== UAOS AUTO UPDATE DONE ====="
.Name -like "UAOS HyperStation*.exe" } |
  Sort-Object Length -Descending |
  Select-Object -First 1

if($DesktopExe){
  Log "Launching portable desktop EXE: $($DesktopExe.FullName)"
  Start-Process -FilePath $DesktopExe.FullName
}else{
  Log "No portable UAOS EXE found. Opening desktop dist folder."
  Start-Process "$Root\desktop\dist"
}

Start-Process "https://universal-arranger-os.vercel.app"

Log "===== UAOS AUTO UPDATE DONE ====="

