$Repo = 'C:\Users\ssare\keyboard-manager-clean'
$Report = "$Repo\reports\UAOS_FINAL_QUALITY_GATE.txt"

cd $Repo
New-Item -ItemType Directory -Force -Path reports | Out-Null

$Urls = @(
  'http://localhost:5173',
  'http://localhost:5173/pricing',
  'http://localhost:5173/status',
  'http://localhost:3001/api/health',
  'http://localhost:3001/api/marketplace/plans',
  'http://localhost:3001/api/release/readiness',
  'http://localhost:3001/api/production/checklist',
  'https://uaos-universal-arranger-os-737954605821.europe-west3.run.app',
  'https://uaos-universal-arranger-os-737954605821.europe-west3.run.app/pricing',
  'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8',
  'https://www.paypal.com/ncp/payment/2W2D2VXEDNTBU'
)

foreach ($u in $Urls) {
  try {
    $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
    "$u -> $($r.StatusCode)" | Tee-Object -FilePath $Report -Append
  } catch {
    "$u -> FAILED" | Tee-Object -FilePath $Report -Append
  }
}

cd frontend
npm run build
cd ..

cd backend
node --check src/server.js
cd ..

git status --short | Tee-Object -FilePath $Report -Append

notepad $Report
