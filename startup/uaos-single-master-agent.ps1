$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
$Log = "$Repo\logs\single-master-agent.log"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" |
  Out-File $Log -Append -Encoding utf8
}

cd $Repo

Log "UAOS SINGLE MASTER AGENT STARTED"

while($true){

  try {

    git pull | Out-File $Log -Append

    if(Test-Path "scripts\build-agents-monitor.ps1"){
      powershell -ExecutionPolicy Bypass -File scripts\build-agents-monitor.ps1 |
      Out-File $Log -Append
    }

    if(Test-Path "docs\index.html"){
      Copy-Item docs\index.html public\index.html -Force -ErrorAction SilentlyContinue
    }

    git add . | Out-File $Log -Append
    git commit -m "UAOS single master maintenance cycle" |
    Out-File $Log -Append

    git push | Out-File $Log -Append

    Log "Cycle complete"

  } catch {
    Log "ERROR: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 1800
}
