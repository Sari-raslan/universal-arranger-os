$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean";$A="$R\uaos-live-clean";$T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force $D|Out-Null
 $J="reports\UAOS_FINAL_09_RETRY_DEPLOY_$T.json";$M="reports\UAOS_FINAL_09_RETRY_DEPLOY_$T.md"
 function W($m,$c="Gray"){Write-Host $m -ForegroundColor $c}
 function F($m){W "[FINAL-09 DEPLOY FAIL] $m" Red;throw $m}
 try{
  cd $R
  $B=git rev-parse --abbrev-ref HEAD
  $S=git status --short|Out-String
  if($S-match"(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden status"}
  pushd $A;npm run build;$C=$LASTEXITCODE;popd;if($C-ne 0){F "Build failed"}
  if(!(Get-Command vercel -ErrorAction SilentlyContinue)){F "Vercel CLI missing"}
  pushd $A;vercel --prod --yes;$VC=$LASTEXITCODE;popd;if($VC-ne 0){F "Vercel deploy failed or limit still active"}
  $Urls=@("https://universal-arranger-os.vercel.app/universal-arranger-os/","https://universal-arranger-os.vercel.app/universal-arranger-os/launch/status.html","https://uaos-public-live.vercel.app/universal-arranger-os/")
  $H=@();foreach($U in $Urls){try{$Res=Invoke-WebRequest $U -UseBasicParsing -TimeoutSec 20;$H+=[ordered]@{url=$U;status=[int]$Res.StatusCode;ok=$true};W "[PASS] $U" Green}catch{$H+=[ordered]@{url=$U;status="FAIL";ok=$false;error=$_.Exception.Message};W "[WARN] $U" Yellow}}
  $O=[ordered]@{result="FINAL_PUBLIC_DEPLOY_RETRY_DONE";build="PASS";deploy="PASS";health=$H;branch=$B;timestamp=$T}
  $O|ConvertTo-Json -Depth 10|Set-Content "$R\$J" -Encoding UTF8
  "# UAOS FINAL-09 Retry Deploy

Result: FINAL_PUBLIC_DEPLOY_RETRY_DONE

Build: PASS
Deploy: PASS" | Set-Content "$R\$M" -Encoding UTF8
  git add -- $J $M;git commit -m "FINAL-09 retry deploy report";git push origin $B
  W "FINAL-09 DEPLOY RETRY PASS" Green
 }catch{W "STOPPED SAFELY. PowerShell did not close." Red;W $_.Exception.Message Yellow}
}
