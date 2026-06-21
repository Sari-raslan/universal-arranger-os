$ErrorActionPreference="Stop"
&{
 $R="C:\Users\ssare\keyboard-manager-clean"
 $A="$R\uaos-live-clean"
 $T=Get-Date -Format yyyyMMdd-HHmmss
 $D="$R\reports";New-Item -ItemType Directory -Force $D|Out-Null
 function F($m){Write-Host "[PAY-33 QA FAIL] $m" -ForegroundColor Red;throw $m}
 $Required=@("$A\public\checkout\payment-waitlist.html","$A\public\checkout\contact-sales.html","$A\public\commercial\pricing-faq.html","$A\public\legal\germany-eu-tax-readiness.html","$A\public\commercial\payment-sitemap.html","$A\public\paypal\sandbox-approval-gate.json","$A\public\paypal\paypal-sandbox-config.placeholder.json")
 foreach($p in $Required){if(!(Test-Path $p)){F "Missing $p"}}
 $Files=Get-ChildItem "$A\src","$A\public\checkout","$A\public\commercial","$A\public\paypal","$A\public\legal","$A\public\qa" -Recurse -File -ErrorAction SilentlyContinue
 foreach($f in $Files){$c=Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue;if($c -match "sk_live_|pk_live_|PAYPAL_LIVE_|STRIPE_SECRET|paypal\.com/sdk/js\?client-id=|create-payment-intent|create-order|capture-order|/capture"){F "Forbidden live payment pattern in $($f.FullName)"}}
 cd $R
 $S=git status --short|Out-String
 if($S -match "(?i)(^|\s|/|\\)fixtures(/|\\)|\.(sty|set|prs|stl|pat|msp|kst)\b|production-parser|real-writer|keyboard-output|dist-output"){F "Forbidden project status"}
 pushd $A;npm run build;$C=$LASTEXITCODE;popd
 if($C -ne 0){F "Build failed"}
 @{result="PASS";build="PASS";paymentActivation="NOT_ACTIVE";commercialGate="LOCKED";timestamp=$T}|ConvertTo-Json -Depth 8|Set-Content "$D\UAOS_PAY_33_FINAL_COMMERCIAL_GATE_QA_$T.json" -Encoding UTF8
 Write-Host "UAOS PAY-33 FINAL COMMERCIAL GATE QA PASS" -ForegroundColor Green
}
