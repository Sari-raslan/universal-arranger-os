param()

$ProjectRoot = (Get-Location).Path
$LogFile = "$ProjectRoot\logs\autonomous-agent.log"

function Log($msg) {
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$time | $msg" | Tee-Object -FilePath $LogFile -Append
}

function GitPush {
    git add . | Out-Null
    git commit -m "UAOS autonomous improvement update" 2>$null
    git push 2>$null
}

function ImproveLandingPage {

    Log "Improving landing page UI"

    $index = "$ProjectRoot\public\index.html"

    if (!(Test-Path $index)) { return }

    $html = Get-Content $index -Raw

    if ($html -notmatch "floating-notes") {

        $inject = @"
<style>
.floating-notes{
position:fixed;
inset:0;
pointer-events:none;
overflow:hidden;
z-index:0;
}
.note{
position:absolute;
font-size:40px;
opacity:.12;
animation:floatNote linear infinite;
}
@keyframes floatNote{
from{transform:translateY(100vh) rotate(0deg)}
to{transform:translateY(-120vh) rotate(360deg)}
}
.glow{
box-shadow:0 0 30px #7b61ff;
}
</style>

<div class='floating-notes'>
<div class='note' style='left:5%;animation-duration:20s'></div>
<div class='note' style='left:18%;animation-duration:14s'></div>
<div class='note' style='left:32%;animation-duration:17s'></div>
<div class='note' style='left:48%;animation-duration:22s'></div>
<div class='note' style='left:67%;animation-duration:16s'></div>
<div class='note' style='left:80%;animation-duration:19s'></div>
</div>
"@

        $html = $html.Replace("<body>", "<body>`n$inject")
    }

    Set-Content $index $html -Encoding UTF8

    Copy-Item $index "$ProjectRoot\docs\index.html" -Force
}

function ImproveVideos {

    Log "Checking video assets"

    $videos = Get-ChildItem "$ProjectRoot\ai-videos\output_v2\*.mp4" -ErrorAction SilentlyContinue

    if ($videos.Count -lt 4) {

        Log "Generating more videos"

        if (Test-Path "$ProjectRoot\ai-videos\make_better_demo_videos.py") {
            & "$ProjectRoot\ai-videos\.venv_v2\Scripts\python.exe" `
              "$ProjectRoot\ai-videos\make_better_demo_videos.py"
        }
    }
}

function CreateDailyReport {

    Log "Creating report"

    $report = @"
UAOS Autonomous Report
======================

Date:
$(Get-Date)

Website:
https://sari-raslan.github.io/universal-arranger-os/

Videos:
$((Get-ChildItem "$ProjectRoot\ai-videos\output_v2\*.mp4").Count)

Git Status:
$(git status --short)

Last Commit:
$(git log -1 --pretty=format:"%h - %s")

"@

    $report | Out-File "$ProjectRoot\reports\latest-report.txt" -Encoding utf8
}

function BackupProject {

    Log "Creating backup"

    $date = Get-Date -Format "yyyyMMdd-HHmm"

    Compress-Archive `
        -Path "$ProjectRoot\public",
              "$ProjectRoot\docs",
              "$ProjectRoot\backend",
              "$ProjectRoot\ai-videos\output_v2" `
        -DestinationPath "$ProjectRoot\backups\uaos-backup-$date.zip" `
        -Force
}

function LaunchPreview {

    Log "Opening preview"

    Start-Process "https://sari-raslan.github.io/universal-arranger-os/"
}

function AutonomousLoop {

    while ($true) {

        try {

            Log "===== AUTONOMOUS CYCLE START ====="

            git pull

            ImproveLandingPage

            ImproveVideos

            CreateDailyReport

            BackupProject

            GitPush

            LaunchPreview

            Log "===== AUTONOMOUS CYCLE COMPLETE ====="

        }
        catch {
            Log "ERROR: $($_.Exception.Message)"
        }

        Start-Sleep -Seconds 1800
    }
}

AutonomousLoop
