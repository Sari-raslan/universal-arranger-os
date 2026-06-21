$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force $D|Out-Null
 function F($m){Write-Host "[PAY FINAL QA FAIL] $m" -ForegroundColor Red;throw $m}
 $Required=@("$A\public\commercial\uaos-pricing-lock.json","$A\public\commercial\uaos-pricing-config.json","$A\public\commercial\pricing-comparison.html","$A\public\checkout\starter.html","$A\public\checkout\pro.html","$A\public\checkout\studio.html","$A\public\checkout\manual-invoice.html","$A\public\paypal\paypal-readiness.json","$A\public\paypal\paypal-sandbox-instructions.html","$A\public\paypal\sandbox-checkout-preview.html","$A\public\legal\payment-terms.html","$A\public\legal\subscription-cancellation.html","$A\public\legal\vat-tax-note.html","$A\public\qa\payment-dashboard.html")
 foreach($p in $Required){if(!(Test-Path $p)){F "Missing $p"}}
 $Files=Get-ChildItem "$A\src","$A\public\commercial","$A\public\checkout","$A\public\paypal","$A\public\legal","$A\public\qa" -Recurse -File -ErrorAction SilentlyContinue
 foreach($f in $Files){$c=Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue;if($c -match "sk_live_|pk_live_|PAYPAL_LIVE_|STRIPE_SECRET|paypal\.com/sdk/js\?client-id=|create-payment-intent|create-order|capture-order|/capture"){F "Forbidden live payment pattern in $($f.FullName)"}}
 cd $R
 $S=git status --short|Out-String
 if($S -match "(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden project status"}
 pushd $A;npm run build;$C=$LASTEXITCODE;popd
 if($C -ne 0){F "Build failed"}
 @{result="PASS";build="PASS";paymentActivation="NOT_ACTIVE";requiredCount=$Required.Count;timestamp=$T}|ConvertTo-Json -Depth 8|Set-Content "$D\UAOS_PAY_14_FINAL_PAYMENT_QA_$T.json" -Encoding UTF8
 Write-Host "UAOS PAY-14 FINAL PAYMENT QA PASS" -ForegroundColor Green
}
