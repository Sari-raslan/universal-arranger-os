$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
$Log = "$Repo\logs\master-autonomous-agent.log"
$Report = "$Repo\reports\MASTER_AGENT_STATUS.txt"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Out-File $Log -Append -Encoding utf8
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" | Out-File $Log -Append -Encoding utf8
}

function HasCmd($c){ return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

cd $Repo
Log "MASTER AGENT FRESH START"

while ($true) {
  try {
    Log "===== UAOS CYCLE START ====="

    git pull | Out-File $Log -Append

    $tools = @{
      Git = HasCmd "git"
      GitHubCLI = HasCmd "gh"
      Python = HasCmd "python"
      Node = HasCmd "node"
      Vercel = HasCmd "vercel"
      Ollama = HasCmd "ollama"
    }

    if ($tools.Ollama) {
      Log "Ollama detected"
      ollama list | Out-File $Log -Append
      ollama pull llama3.2 | Out-File $Log -Append
    }

    if (Test-Path "scripts\paypal-background-agent.ps1") {
      Log "Running PayPal/UI updater"
      powershell -ExecutionPolicy Bypass -File scripts\paypal-background-agent.ps1 | Out-File $Log -Append
    }

    if (Test-Path "scripts\build-agents-monitor.ps1") {
      Log "Updating monitor"
      powershell -ExecutionPolicy Bypass -File scripts\build-agents-monitor.ps1 | Out-File $Log -Append
    }

    if (Test-Path "ai-videos\make_better_demo_videos.py") {
      Log "Checking videos"
      if (Test-Path "ai-videos\.venv_v2\Scripts\python.exe") {
        .\ai-videos\.venv_v2\Scripts\python.exe ai-videos\make_better_demo_videos.py | Out-File $Log -Append
      }
    }

    $videoCount = (Get-ChildItem "ai-videos\output_v2\*.mp4" -ErrorAction SilentlyContinue).Count
    $taskInfo = Get-Process powershell -ErrorAction SilentlyContinue | Select-Object Id,ProcessName | Out-String
    $lastCommit = git log -1 --pretty=format:"%h - %s"

@"
UAOS MASTER AGENT STATUS

Time:
$(Get-Date)

Website:
https://sari-raslan.github.io/universal-arranger-os/

Payment:
https://www.paypal.com/ncp/payment/4PHMPZL66YEG8

Videos:
$videoCount MP4 files

Tools:
Git: $($tools.Git)
GitHub CLI: $($tools.GitHubCLI)
Python: $($tools.Python)
Node: $($tools.Node)
Vercel: $($tools.Vercel)
Ollama/Llama: $($tools.Ollama)

Active PowerShell Processes:
$taskInfo

Last Commit:
$lastCommit

Next manual items:
- Upload videos to TikTok / YouTube / X
- Fix aeplatform.app DNS
- Create real backend/auth
- Connect payment webhook
"@ | Out-File $Report -Encoding utf8

    git add . | Out-File $Log -Append
    git commit -m "UAOS master agent fresh cycle update" | Out-File $Log -Append
    git push | Out-File $Log -Append

    Log "===== UAOS CYCLE COMPLETE ====="
  }
  catch {
    Log "ERROR: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 1800
}
