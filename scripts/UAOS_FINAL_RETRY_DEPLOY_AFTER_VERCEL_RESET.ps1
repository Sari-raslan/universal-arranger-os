$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force -Path $D|Out-Null
 function W($m,$c="Gray"){Write-Host $m -ForegroundColor $c}
 function F($m){W "[RETRY DEPLOY FAIL] $m" Red;throw $m}
 try{
  cd $R
  $B=git rev-parse --abbrev-ref HEAD
  $S=git status --short|Out-String
  if($S -match "(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden status"}
  pushd $A
  npm run build
  $C=$LASTEXITCODE
  popd
  if($C -ne 0){F "Build failed"}
  if(!(Get-Command vercel -ErrorAction SilentlyContinue)){F "Vercel CLI missing"}
  pushd $A
  vercel --prod --yes
  $VC=$LASTEXITCODE
  popd
  if($VC -ne 0){F "Vercel deploy failed or limit still active"}
  $J="reports\UAOS_FINAL_RETRY_DEPLOY_$T.json"
  $M="reports\UAOS_FINAL_RETRY_DEPLOY_$T.md"
  @{result="PUBLIC_DEPLOY_RETRY_DONE";build="PASS";deploy="PASS";branch=$B;timestamp=$T}|ConvertTo-Json -Depth 8|Set-Content -Path "$R\$J" -Encoding UTF8
  "# UAOS Retry Deploy`n`nResult: PUBLIC_DEPLOY_RETRY_DONE`nBuild: PASS`nDeploy: PASS`n"|Set-Content -Path "$R\$M" -Encoding UTF8
  git add -- $J $M
  git commit -m "Final retry deploy report"
  git push origin $B
  W "PUBLIC DEPLOY RETRY PASS" Green
 }catch{W "STOPPED SAFELY. PowerShell did not close." Red;W $_.Exception.Message Yellow}
}
