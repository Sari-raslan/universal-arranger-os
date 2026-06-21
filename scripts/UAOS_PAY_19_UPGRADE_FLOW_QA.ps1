$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force $D|Out-Null
 function F($m){Write-Host "[PAY-19 QA FAIL] $m" -ForegroundColor Red;throw $m}
 $Required=@("$A\public\checkout\upgrade.html","$A\public\checkout\success.html","$A\public\checkout\cancel.html","$A\public\checkout\invoice-request.html","$A\public\checkout\starter.html","$A\public\checkout\pro.html","$A\public\checkout\studio.html","$A\public\commercial\uaos-pricing-config.json","$A\public\paypal\paypal-readiness.json")
 foreach($p in $Required){if(!(Test-Path $p)){F "Missing $p"}}
 $Files=Get-ChildItem "$A\src","$A\public\checkout","$A\public\commercial","$A\public\paypal","$A\public\legal" -Recurse -File -ErrorAction SilentlyContinue
 foreach($f in $Files){$c=Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue;if($c -match "sk_live_|pk_live_|PAYPAL_LIVE_|STRIPE_SECRET|paypal\.com/sdk/js\?client-id=|create-payment-intent|create-order|capture-order|/capture"){F "Forbidden live payment pattern in $($f.FullName)"}}
 cd $R
 $S=git status --short|Out-String
 if($S -match "(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden project status"}
 pushd $A;npm run build;$C=$LASTEXITCODE;popd
 if($C -ne 0){F "Build failed"}
 @{result="PASS";build="PASS";paymentActivation="NOT_ACTIVE";upgradeFlow="PLACEHOLDER_ONLY";timestamp=$T}|ConvertTo-Json -Depth 8|Set-Content "$D\UAOS_PAY_19_UPGRADE_FLOW_QA_$T.json" -Encoding UTF8
 Write-Host "UAOS PAY-19 UPGRADE FLOW QA PASS" -ForegroundColor Green
}
