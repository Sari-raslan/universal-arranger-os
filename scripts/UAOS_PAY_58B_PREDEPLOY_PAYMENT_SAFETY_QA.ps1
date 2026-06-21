$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force $D|Out-Null
 function F($m){Write-Host "[PAY-58B QA FAIL] $m" -ForegroundColor Red;throw $m}
 $Required=@("$A\public\commercial\commercial-launch-guard.json","$A\public\commercial\buyer-notice.html","$A\public\commercial\predeploy-payment-safety.html","$A\public\qa\final-payment-launch-guard.html","$A\public\commercial\final-payment-lock.json","$A\public\commercial\public-safe-payment-status.json","$A\public\paypal\sandbox-approval-gate.json")
 foreach($p in $Required){if(!(Test-Path $p)){F "Missing $p"}}
 $Files=Get-ChildItem "$A\src","$A\public\checkout","$A\public\commercial","$A\public\paypal","$A\public\legal","$A\public\qa","$A\public\pages" -Recurse -File -ErrorAction SilentlyContinue
 foreach($f in $Files){$c=Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue;if($c -match "sk_live_|pk_live_|PAYPAL_LIVE_|STRIPE_SECRET|paypal\.com/sdk/js\?client-id=|create-payment-intent|create-order|capture-order|/capture|client_secret|access_token"){F "Forbidden payment or secret pattern in $($f.FullName)"}}
 cd $R
 $S=git status --short|Out-String
 if($S -match "(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden project status"}
 pushd $A;npm run build;$C=$LASTEXITCODE;popd
 if($C -ne 0){F "Build failed"}
 @{result="PASS";build="PASS";paymentActivation="NOT_ACTIVE";commercialLaunchGuard="ACTIVE";preDeploySafe="PLACEHOLDER_ONLY";timestamp=$T}|ConvertTo-Json -Depth 8|Set-Content "$D\UAOS_PAY_58B_PREDEPLOY_PAYMENT_SAFETY_QA_$T.json" -Encoding UTF8
 Write-Host "UAOS PAY-58B PREDEPLOY PAYMENT SAFETY QA PASS" -ForegroundColor Green
}
