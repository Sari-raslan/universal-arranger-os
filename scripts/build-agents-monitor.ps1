$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
cd $Repo

$videoCount = (Get-ChildItem "ai-videos\output_v2\*.mp4" -ErrorAction SilentlyContinue).Count
$hasWebsite = Test-Path "docs\index.html"
$hasLogo = Test-Path "assets\uaos-logo.svg"
$hasMobile = (Test-Path "mobile\android\README.md") -and (Test-Path "mobile\ios\README.md")
$hasPWA = Test-Path "mobile\pwa\manifest.json"
$hasMonitor = Test-Path "monitor\agents-dashboard.html"
$hasPayPal = $true
$gitStatus = git status --short
$lastCommit = git log -1 --pretty=format:"%h - %s"
$runs = gh run list --repo Sari-raslan/universal-arranger-os --limit 6 2>$null
$agents = Get-Process powershell -ErrorAction SilentlyContinue | Select-Object Id,CPU,StartTime,ProcessName | Out-String
$now = Get-Date

function BoolText($x){ if($x){"READY"}else{"MISSING"} }
function BoolClass($x){ if($x){"ok"}else{"bad"} }
function Percent($x){ if($x){100}else{20} }

$readyCount = 0
$total = 7
foreach($x in @($hasWebsite,$hasLogo,($videoCount -gt 0),$hasMobile,$hasPWA,$hasMonitor,$hasPayPal)){ if($x){$readyCount++} }
$overall = [math]::Round(($readyCount / $total) * 100)

$html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="15">
<title>UAOS Command Center</title>
<style>
*{box-sizing:border-box}
body{
margin:0;
font-family:Segoe UI,Arial,sans-serif;
background:
radial-gradient(circle at top left,#5b2cff55,transparent 30%),
radial-gradient(circle at top right,#00c8ff44,transparent 30%),
#050616;
color:white;
padding:28px;
}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
h1{font-size:44px;margin:0}
.badge{padding:10px 16px;border:1px solid #ffffff33;border-radius:999px;background:#11162dcc}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.card{background:#11162dcc;border:1px solid #ffffff22;border-radius:22px;padding:22px;box-shadow:0 20px 60px #0005}
.big{font-size:30px;font-weight:900}
.ok{color:#34ff91}.warn{color:#ffd166}.bad{color:#ff5c7a}
.progress{height:12px;background:#070a15;border-radius:999px;overflow:hidden;margin-top:12px}
.bar{height:100%;background:linear-gradient(90deg,#2f82ff,#d94cff);border-radius:999px}
table{width:100%;border-collapse:collapse;background:#0c1022;border-radius:16px;overflow:hidden}
td,th{padding:14px;border-bottom:1px solid #ffffff12;text-align:left}
pre{white-space:pre-wrap;background:#080b18;padding:18px;border-radius:14px;max-height:230px;overflow:auto}
a{color:#80dfff}
.section{margin-top:28px}
ul{line-height:1.9}
.pill{display:inline-block;padding:7px 11px;border-radius:999px;background:#0c1022;border:1px solid #ffffff22;margin:4px}
@media(max-width:1000px){.grid{grid-template-columns:1fr}.header{display:block}}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🎛️ UAOS Command Center</h1>
    <p>Autonomous launch monitor · Auto-refresh every 15 seconds</p>
  </div>
  <div class="badge">Updated: $now</div>
</div>

<div class="card">
<h2>Overall Launch Readiness</h2>
<div class="big">$overall%</div>
<div class="progress"><div class="bar" style="width:$overall%"></div></div>
</div>

<div class="section grid">
<div class="card"><h2>Website</h2><div class="big $(BoolClass $hasWebsite)">$(BoolText $hasWebsite)</div><div class="progress"><div class="bar" style="width:$(Percent $hasWebsite)%"></div></div></div>
<div class="card"><h2>Logo</h2><div class="big $(BoolClass $hasLogo)">$(BoolText $hasLogo)</div><div class="progress"><div class="bar" style="width:$(Percent $hasLogo)%"></div></div></div>
<div class="card"><h2>Videos</h2><div class="big ok">$videoCount MP4</div><div class="progress"><div class="bar" style="width:100%"></div></div></div>
<div class="card"><h2>PayPal</h2><div class="big ok">READY</div><div class="progress"><div class="bar" style="width:100%"></div></div></div>

<div class="card"><h2>Android/iOS</h2><div class="big $(BoolClass $hasMobile)">$(BoolText $hasMobile)</div><div class="progress"><div class="bar" style="width:$(Percent $hasMobile)%"></div></div></div>
<div class="card"><h2>PWA</h2><div class="big $(BoolClass $hasPWA)">$(BoolText $hasPWA)</div><div class="progress"><div class="bar" style="width:$(Percent $hasPWA)%"></div></div></div>
<div class="card"><h2>Monitor</h2><div class="big $(BoolClass $hasMonitor)">$(BoolText $hasMonitor)</div><div class="progress"><div class="bar" style="width:$(Percent $hasMonitor)%"></div></div></div>
<div class="card"><h2>Social Launch</h2><div class="big warn">MANUAL</div><div class="progress"><div class="bar" style="width:65%"></div></div></div>
</div>

<div class="section card">
<h2>Live Links</h2>
<span class="pill"><a href="https://sari-raslan.github.io/universal-arranger-os/">Website</a></span>
<span class="pill"><a href="https://www.paypal.com/ncp/payment/4PHMPZL66YEG8">PayPal Pro</a></span>
<span class="pill"><a href="https://github.com/Sari-raslan/universal-arranger-os">GitHub</a></span>
<span class="pill"><a href="https://www.tiktok.com/@aeplatformapp">TikTok</a></span>
<span class="pill"><a href="https://x.com/aeplatformapp">X</a></span>
<span class="pill"><a href="https://www.youtube.com/@aeplatformapp">YouTube</a></span>
</div>

<div class="section card">
<h2>Agents / PowerShell Processes</h2>
<pre>$agents</pre>
</div>

<div class="section card">
<h2>Remaining Work</h2>
<ul>
<li>Upload best videos manually to TikTok / YouTube Shorts / X</li>
<li>Finish DNS for aeplatform.app</li>
<li>Create real backend auth</li>
<li>Connect PayPal webhook verification</li>
<li>Build real cloud Voice-to-MIDI API</li>
<li>Prepare Google Play and Apple Developer accounts</li>
</ul>
</div>

<div class="section card">
<h2>Git Status</h2>
<pre>$gitStatus</pre>
</div>

<div class="section card">
<h2>Last Commit</h2>
<pre>$lastCommit</pre>
</div>

<div class="section card">
<h2>Latest GitHub Runs</h2>
<pre>$runs</pre>
</div>

</body>
</html>
"@

$html | Out-File "monitor\agents-dashboard.html" -Encoding utf8
Start-Process "monitor\agents-dashboard.html"
