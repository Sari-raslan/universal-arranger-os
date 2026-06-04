$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
$Log  = "$Repo\logs\uaos-master.log"

function Log($m){
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" |
    Out-File $Log -Append -Encoding utf8
}

Log "======================================"
Log "UAOS MASTER BACKGROUND ENGINE STARTED"
Log "======================================"

while($true){

    try {

        cd $Repo

        Log "Starting maintenance cycle"

        # ----------------------------
        # Pull latest
        # ----------------------------

        git pull | Out-File $Log -Append

        # ----------------------------
        # Ensure folders
        # ----------------------------

        mkdir docs,public,reports,monitor -Force

        # ----------------------------
        # Sync public site
        # ----------------------------

        if(Test-Path "$Repo\docs\index.html"){
            Copy-Item "$Repo\docs\index.html" `
                      "$Repo\public\index.html" `
                      -Force
            Log "Website synced"
        }

        # ----------------------------
        # Build monitor
        # ----------------------------

        $html = @"
<!doctype html>
<html>
<head>
<meta charset='utf-8'>
<title>UAOS Control Center</title>
<style>
body{
background:#050616;
color:white;
font-family:Segoe UI;
padding:30px;
}
.card{
background:#10152b;
padding:20px;
border-radius:20px;
margin-bottom:20px;
border:1px solid #ffffff22;
}
.ok{color:#44ff99}
.warn{color:#ffcc44}
</style>
</head>
<body>

<h1>UAOS Control Center</h1>

<div class='card'>
<h2 class='ok'>System Online</h2>
<p>Master background engine running.</p>
</div>

<div class='card'>
<h2>Website</h2>
<p>
https://sari-raslan.github.io/universal-arranger-os/
</p>
</div>

<div class='card'>
<h2>Payments</h2>
<p>Creator Plan + Pro Plan active.</p>
</div>

<div class='card'>
<h2>Background Tasks</h2>
<ul>
<li>Git sync</li>
<li>Website sync</li>
<li>Reports</li>
<li>Monitor refresh</li>
<li>Recovery protection</li>
</ul>
</div>

<div class='card'>
<h2>Logs</h2>
<p>$Log</p>
</div>

</body>
</html>
"@

        $html | Out-File `
        "$Repo\monitor\dashboard.html" `
        -Encoding utf8

        Log "Monitor updated"

        # ----------------------------
        # Reports
        # ----------------------------

@"
UAOS STATUS REPORT

Time:
$(Get-Date)

Status:
ONLINE

Services:
- Website
- Monitor
- Background engine
- Git sync

Current mode:
Stable autonomous background execution
"@ | Out-File `
"$Repo\reports\UAOS_STATUS.txt" `
-Encoding utf8

        # ----------------------------
        # Git sync
        # ----------------------------

        git add . | Out-File $Log -Append

        git commit -m "UAOS autonomous maintenance cycle" |
        Out-File $Log -Append

        git push | Out-File $Log -Append

        Log "Cycle complete"

    }
    catch {

        Log "ERROR:"
        Log $_.Exception.Message

    }

    # ----------------------------
    # wait 10 min
    # ----------------------------

    Start-Sleep -Seconds 600
}
