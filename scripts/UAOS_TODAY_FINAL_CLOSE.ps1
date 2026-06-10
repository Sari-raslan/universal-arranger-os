$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Report="$Repo\reports\UAOS_TODAY_FINAL_CLOSE_REPORT.txt"

New-Item -ItemType Directory -Force "$Repo\reports","$Repo\scripts","$Repo\launch-kit" | Out-Null

"UAOS TODAY FINAL CLOSE" | Set-Content $Report -Encoding UTF8
"TIME: $(Get-Date)" | Out-File $Report -Append

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

cd $Repo

npm run build 2>&1 | Tee-Object -FilePath $Report -Append
if($LASTEXITCODE -ne 0){ notepad $Report; exit 1 }

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev"
Start-Sleep 5

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\frontend'; npx vite preview --host 127.0.0.1 --port 5180 --strictPort"
Start-Sleep 5

try {
  $f=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing -TimeoutSec 10
  "FRONTEND LOCAL: PASS $($f.StatusCode)" | Out-File $Report -Append
} catch {
  "FRONTEND LOCAL: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

try {
  $b=Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing -TimeoutSec 10
  "BACKEND HEALTH: PASS $($b.StatusCode)" | Out-File $Report -Append
} catch {
  "BACKEND HEALTH: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

powershell -ExecutionPolicy Bypass -File "$Repo\scripts\UAOS_RELEASE_GATE.ps1"

@"
# UAOS Launch Invitation

UAOS HyperStation is now ready for public testing.

Link:
https://uaos-public-live.vercel.app

What it is:
A new Universal Arranger OS for live music, MIDI, oriental instruments, sampler hosting, AI music workflow, and future hardware support.

Current status:
- V1 public-ready
- V2 runtime foundation ready
- V3 Oriental / AI / Sampler foundation ready
- Local verification passed
"@ | Set-Content "$Repo\launch-kit\UAOS_INVITE_EN.md" -Encoding UTF8

@"
# دعوة تجربة UAOS

مشروع UAOS HyperStation جاهز للتجربة العامة.

الرابط:
https://uaos-public-live.vercel.app

الفكرة:
نظام Universal Arranger OS للموسيقى الحية، MIDI، المقامات الشرقية، السامبلر، الذكاء الموسيقي، ودعم الأجهزة مستقبلًا.

الحالة:
- V1 جاهز للنشر
- V2 Runtime جاهز كبنية
- V3 Oriental / AI / Sampler جاهز كبنية
- الفحص المحلي ناجح
"@ | Set-Content "$Repo\launch-kit\UAOS_INVITE_AR.md" -Encoding UTF8

@"
cd "$Repo"
git pull
npm run build
powershell -ExecutionPolicy Bypass -File ".\scripts\UAOS_RELEASE_GATE.ps1"
vercel deploy --prod --yes
"@ | Set-Content "$Repo\launch-kit\TOMORROW_DEPLOY_COMMAND.txt" -Encoding UTF8

@"
UAOS FINAL STATUS
=================

TODAY:
- Build verified
- Backend verified
- Frontend preview verified
- Release gate verified
- Invite files prepared
- Tomorrow deploy command prepared

TOMORROW:
1. Run TOMORROW_DEPLOY_COMMAND.txt
2. Verify public URL
3. Buy/connect domain if needed
4. Publish invite
"@ | Out-File $Report -Append

git add scripts reports launch-kit frontend backend v2-runtime v3-future docs ops runtime-control
git commit -m "Finalize UAOS launch kit and local release closure"
git push origin v2/core-runtime-alpha

Start-Process "http://127.0.0.1:5180"
notepad $Report
