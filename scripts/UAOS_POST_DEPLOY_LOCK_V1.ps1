$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Live="https://universal-arranger-os.vercel.app"
Set-Location $Root

New-Item -ItemType Directory -Force reports,release-kit,scripts | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Report="reports\UAOS_PUBLIC_V1_LAUNCH_$Stamp.txt"

function Log($m){ $m | Tee-Object -FilePath $Report -Append }

Log "UAOS PUBLIC V1 LAUNCH REPORT"
Log "Time: $(Get-Date)"
Log "Live URL: $Live"

$Routes=@(
  "/",
  "/#/sing",
  "/#/studio",
  "/#/pro",
  "/#/midi",
  "/#/pricing",
  "/#/demo",
  "/#/downloads",
  "/#/agents"
)

Log "`n=== ROUTE CHECKS ==="
foreach($r in $Routes){
  $url="$Live$r"
  try{
    $res=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    Log "$url => $($res.StatusCode)"
  } catch {
    Log "$url => FAIL $($_.Exception.Message)"
  }
}

@"
# UAOS PUBLIC V1 LINKS

Live:
$Live

Products:
- UAOS Sing
- UAOS Studio
- UAOS Pro Arranger

Routes:
$Live
$Live/#/sing
$Live/#/studio
$Live/#/pro
$Live/#/midi
$Live/#/pricing
$Live/#/demo
$Live/#/downloads
$Live/#/agents
"@ | Set-Content "release-kit\UAOS_PUBLIC_V1_LINKS.md" -Encoding UTF8

@"
# UAOS V1 PUBLIC LAUNCH STATUS

Status: PUBLIC V1 DEPLOYED

Live URL:
$Live

Completed:
- V1 web platform
- Three product modes
- MIDI diagnostics page
- Pricing page
- Demo page
- Downloads page
- Agent system page
- Vercel production deployment

Next:
1. React Router real routes
2. WebMIDI real scan
3. Voice upload
4. Electron desktop app
5. APK package
6. Promotion page polish
7. Audio engine foundation
"@ | Set-Content "release-kit\UAOS_PUBLIC_V1_STATUS.md" -Encoding UTF8

Log "`n=== BUILD VERIFY ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Report -Append

Log "`n=== GIT SAFE COMMIT ==="
git add release-kit\UAOS_PUBLIC_V1_LINKS.md
git add release-kit\UAOS_PUBLIC_V1_STATUS.md
git add scripts\UAOS_POST_DEPLOY_LOCK_V1.ps1
git commit -m "Record UAOS public V1 deployment" 2>&1 | Tee-Object -FilePath $Report -Append

Log "`n=== FINAL STATUS ==="
git status | Tee-Object -FilePath $Report -Append

notepad $Report
