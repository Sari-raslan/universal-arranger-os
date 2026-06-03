$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
cd $Repo

$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*UAOS*" } | Select-Object TaskName, State
$videoCount = (Get-ChildItem "ai-videos\output_v2\*.mp4" -ErrorAction SilentlyContinue).Count
$hasWebsite = Test-Path "docs\index.html"
$hasLogo = Test-Path "assets\uaos-logo.svg"
$hasMobile = Test-Path "mobile\android\README.md"
$hasIOS = Test-Path "mobile\ios\README.md"
$hasPWA = Test-Path "mobile\pwa\manifest.json"
$gitStatus = git status --short
$lastCommit = git log -1 --pretty=format:"%h - %s"
$runs = gh run list --repo Sari-raslan/universal-arranger-os --limit 5 2>$null

function StatusText($ok) {
    if ($ok) { return "READY" } else { return "MISSING" }
}

function StatusClass($ok) {
    if ($ok) { return "ok" } else { return "bad" }
}

$taskRows = ""
if ($tasks.Count -eq 0) {
    $taskRows = "<tr><td>No UAOS scheduled agents found</td><td class='warn'>NOT RUNNING</td></tr>"
} else {
    foreach ($t in $tasks) {
        $cls = if ($t.State -eq "Running") { "ok" } elseif ($t.State -eq "Ready") { "warn" } else { "bad" }
        $taskRows += "<tr><td>$($t.TaskName)</td><td class='$cls'>$($t.State)</td></tr>"
    }
}

$todo = @(
    "Upload best videos to TikTok, YouTube Shorts, X",
    "Connect aeplatform.app DNS to Vercel",
    "Finish Instagram account",
    "Create real backend auth",
    "Connect payment webhook",
    "Build real cloud Voice-to-MIDI API",
    "Prepare Google Play developer account",
    "Prepare Apple Developer account"
)

$todoHtml = ""
foreach ($i in $todo) {
    $todoHtml += "<li>$i</li>"
}

$html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="15">
<title>UAOS Agent Control Center</title>
<style>
body{font-family:Arial;background:#050616;color:white;margin:0;padding:28px}
h1{font-size:42px;margin-bottom:6px}
p{color:#cfd5ee}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.card{background:#11162d;border:1px solid #ffffff20;border-radius:20px;padding:22px}
.big{font-size:30px;font-weight:900}
.ok{color:#34ff91}.warn{color:#ffd166}.bad{color:#ff5c7a}
table{width:100%;border-collapse:collapse;background:#0c1022;border-radius:16px;overflow:hidden}
td,th{padding:14px;border-bottom:1px solid #ffffff12;text-align:left}
pre{white-space:pre-wrap;background:#080b18;padding:18px;border-radius:14px;max-height:260px;overflow:auto}
a{color:#80dfff}
ul{line-height:1.8}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>

<h1> UAOS Agent Control Center</h1>
<p>Auto-refresh every 15 seconds  Generated: $(Get-Date)</p>

<div class="grid">
<div class="card"><h2>Website</h2><div class="big $(StatusClass $hasWebsite)">$(StatusText $hasWebsite)</div><p>docs/index.html</p></div>
<div class="card"><h2>Logo</h2><div class="big $(StatusClass $hasLogo)">$(StatusText $hasLogo)</div><p>assets/uaos-logo.svg</p></div>
<div class="card"><h2>Videos</h2><div class="big ok">$videoCount MP4</div><p>ai-videos/output_v2</p></div>
<div class="card"><h2>Payment</h2><div class="big ok">READY</div><p>PayPal early access</p></div>

<div class="card"><h2>Android</h2><div class="big $(StatusClass $hasMobile)">$(StatusText $hasMobile)</div><p>mobile/android</p></div>
<div class="card"><h2>iOS</h2><div class="big $(StatusClass $hasIOS)">$(StatusText $hasIOS)</div><p>mobile/ios</p></div>
<div class="card"><h2>PWA</h2><div class="big $(StatusClass $hasPWA)">$(StatusText $hasPWA)</div><p>manifest.json</p></div>
<div class="card"><h2>Launch</h2><div class="big warn">PUBLISH NEXT</div><p>Manual social upload</p></div>
</div>

<h2> Scheduled Agents</h2>
<table>
<tr><th>Agent</th><th>Status</th></tr>
$taskRows
</table>

<h2> Live Links</h2>
<div class="card">
<p><b>Website:</b> <a href="https://sari-raslan.github.io/universal-arranger-os/">https://sari-raslan.github.io/universal-arranger-os/</a></p>
<p><b>Payment:</b> <a href="https://www.paypal.com/ncp/payment/ZB63CA66C98AN">https://www.paypal.com/ncp/payment/ZB63CA66C98AN</a></p>
<p><b>GitHub:</b> <a href="https://github.com/Sari-raslan/universal-arranger-os">https://github.com/Sari-raslan/universal-arranger-os</a></p>
<p><b>TikTok:</b> <a href="https://www.tiktok.com/@aeplatformapp">https://www.tiktok.com/@aeplatformapp</a></p>
<p><b>X:</b> <a href="https://x.com/aeplatformapp">https://x.com/aeplatformapp</a></p>
<p><b>YouTube:</b> <a href="https://www.youtube.com/@aeplatformapp">https://www.youtube.com/@aeplatformapp</a></p>
</div>

<h2> What is Ready</h2>
<div class="card">
<ul>
<li>Landing page</li>
<li>Music logo</li>
<li>PayPal payment link</li>
<li>Multilingual content</li>
<li>Demo videos</li>
<li>Android/iOS/PWA scaffolds</li>
<li>GitHub Actions</li>
<li>Social brand accounts</li>
</ul>
</div>

<h2> Remaining Work</h2>
<div class="card">
<ul>
$todoHtml
</ul>
</div>

<h2> Git Status</h2>
<pre>$gitStatus</pre>

<h2> Last Commit</h2>
<pre>$lastCommit</pre>

<h2> Latest GitHub Runs</h2>
<pre>$runs</pre>

</body>
</html>
"@

$html | Out-File "monitor\agents-dashboard.html" -Encoding utf8
Start-Process "monitor\agents-dashboard.html"
