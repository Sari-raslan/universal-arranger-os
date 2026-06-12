$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force reports,release-kit | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="reports\UAOS_SAFE_DEV_NO_DEPLOY_$Stamp.txt"

function L($m){
  "[$(Get-Date -Format HH:mm:ss)] $m" | Tee-Object -FilePath $Log -Append
}

L "UAOS SAFE DEV MODE START"
L "NO DEPLOY WILL RUN"

L "Checking project..."
if(!(Test-Path "package.json")){
  L "ERROR: package.json not found"
  exit 1
}

L "Running npm build..."
npm run build 2>&1 | Tee-Object -FilePath $Log -Append

if($LASTEXITCODE -ne 0){
  L "BUILD FAIL - STOPPED"
  exit 1
}

L "BUILD PASS"

$Audit="release-kit\UAOS_NO_DEPLOY_AUDIT_$Stamp.txt"
@"
UAOS SAFE DEV AUDIT
NO DEPLOY MODE

BUILD: PASS
TIME: $(Get-Date)

Manual deploy only:
powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
"@ | Set-Content $Audit -Encoding UTF8

L "Audit written: $Audit"
L "DONE - NO DEPLOY"

notepad $Log
