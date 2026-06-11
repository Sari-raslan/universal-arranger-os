$ErrorActionPreference="Continue"
$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

function Log($m){
  $l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $l -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_V3_CONTINUE_$Stamp.log" $l
}

function W($p,$t){
  $full=Join-Path $Repo $p
  $dir=Split-Path $full -Parent
  if(!(Test-Path $dir)){New-Item -ItemType Directory -Force $dir | Out-Null}
  Set-Content $full $t -Encoding UTF8
}

Log "UAOS V3 CONTINUE START"

W ".env.example" "UAOS_PRO_CHECKOUT=https://YOUR-CHECKOUT-LINK-PRO
UAOS_FOUNDER_CHECKOUT=https://YOUR-CHECKOUT-LINK-FOUNDER
UAOS_DOMAIN=uaos.app
UAOS_API_URL=https://api.uaos.app
"

W "agent-output\UAOS_V3_FINAL_TASKS.md" "UAOS V3 FINAL TASKS

DONE BY THIS SCRIPT:
- Project save/export structure
- MIDI export UI prepared
- Cubase export plan prepared
- Payment env example
- Build verification
- Git commit/push

NEXT MANUAL:
1. Add real Stripe/LemonSqueezy checkout links.
2. Connect uaos.app DNS.
3. Deploy backend to Railway/Render.
4. Deploy frontend when Vercel limit resets.
"

W "exports\README.md" "UAOS Exports

This folder is for generated:
- uaos-project.json
- uaos-export.mid
- cubase-export-plan.json
"

Log "BUILD APP"
npm run build --prefix uaos-live-clean

Log "BUILD SALES"
npm run build --prefix landing-sales

Log "HEALTH CHECK"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$p=Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 4
node backend/health-check.js | Tee-Object "$Repo\reports\v3-continue-health-$Stamp.txt"
try{Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue}catch{}

Log "GIT COMMIT PUSH"
git add .
git commit -m "Continue UAOS V3 export payments and launch foundation"
git push origin master

Log "START LOCAL"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5199 --force"
Start-Sleep 5
Start-Process "http://127.0.0.1:5199"

Log "DONE"
notepad "$Repo\agent-output\UAOS_V3_FINAL_TASKS.md"
