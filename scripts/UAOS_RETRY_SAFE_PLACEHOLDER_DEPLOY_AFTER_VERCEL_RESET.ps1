$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $COMM="$A\public\commercial"
 function W($m,$c="Gray"){Write-Host $m -ForegroundColor $c}
 function F($m){W "[RETRY DEPLOY FAIL] $m" Red;throw $m}
 try{
  cd $R
  W "RETRY-01 safety checks..." Cyan
  $Required=@("$COMM\safe-public-deploy-gate.json","$COMM\live-payment-block-safe-deploy.json","$COMM\final-payment-lock.json","$COMM\payment-freeze.json","$COMM\predeploy-payment-lock.json","$COMM\payment-handover-final.json")
  foreach($p in $Required){if(!(Test-Path $p)){F "Missing safety file: $p"}}
  $Forbidden="sk_live_|pk_live_|PAYPAL_LIVE_|STRIPE_SECRET|paypal\.com/sdk/js\?client-id=|create-payment-intent|create-order|capture-order|/capture|client_secret|access_token"
  $Files=Get-ChildItem "$A\src","$A\public" -Recurse -File -ErrorAction SilentlyContinue
  foreach($f in $Files){$c=Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue;if($c -match $Forbidden){F "Forbidden live payment pattern in $($f.FullName)"}}
  W "RETRY-02 build..." Cyan
  pushd $A;npm run build;$C=$LASTEXITCODE;popd
  if($C -ne 0){F "Build failed"}
  W "RETRY-03 run existing Vercel deploy script..." Cyan
  $DeployScript="$R\scripts\UAOS_FINAL_40_RETRY_DEPLOY_AFTER_RESET.ps1"
  if(!(Test-Path $DeployScript)){F "Deploy script missing: $DeployScript"}
  powershell -ExecutionPolicy Bypass -File $DeployScript
  W "SAFE PLACEHOLDER DEPLOY RETRY DONE" Green
  W "Payment remains NOT_ACTIVE. Live payment remains BLOCKED." Yellow
 }catch{
  W "STOPPED SAFELY. No live payment activated." Red
  W $_.Exception.Message Yellow
 }
}
