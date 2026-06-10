$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Out="$Repo\reports\UAOS_LOCAL_VERIFY_REPORT.txt"

function S($t){
  Write-Host ""
  Write-Host "==== $t ====" -ForegroundColor Cyan
}

"UAOS LOCAL VERIFY" | Set-Content $Out -Encoding UTF8

cd $Repo

S "GIT STATUS"
git status --short | Tee-Object -FilePath $Out -Append

S "V1 BUILD"
npm run build 2>&1 | Tee-Object -FilePath $Out -Append

S "V2"
if(Test-Path "$Repo\v2-runtime\package.json"){
  cd "$Repo\v2-runtime"
  npm run check 2>&1 | Tee-Object -FilePath $Out -Append
}

S "V3"
if(Test-Path "$Repo\v3-future\package.json"){
  cd "$Repo\v3-future"
  npm run check 2>&1 | Tee-Object -FilePath $Out -Append
  npm test 2>&1 | Tee-Object -FilePath $Out -Append
}

S "ORIENTAL ENGINE"
if(Test-Path "$Repo\v3-future\oriental-engine\package.json"){
  cd "$Repo\v3-future\oriental-engine"
  npm run legal 2>&1 | Tee-Object -FilePath $Out -Append
}

S "FRONTEND DIST"
if(Test-Path "$Repo\frontend\dist"){
  "DIST OK" | Tee-Object -FilePath $Out -Append
}else{
  "DIST FAIL" | Tee-Object -FilePath $Out -Append
}

notepad $Out

Write-Host ""
Write-Host "UAOS LOCAL VERIFY DONE" -ForegroundColor Green
