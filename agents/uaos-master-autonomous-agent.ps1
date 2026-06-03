$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
$Log = "$Repo\logs\master-autonomous-agent.log"
$Report = "$Repo\reports\MASTER_AGENT_STATUS.txt"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" | Out-File $Log -Append -Encoding utf8
}

function Exists($cmd){
  return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

cd $Repo
Log "MASTER AGENT STARTED"

while ($true) {
  try {
    Log "===== NEW CYCLE START ====="

    git pull | Out-File $Log -Append

    Log "Checking installed agents/tools"

    $ollama = Exists "ollama"
    $git = Exists "git"
    $gh = Exists "gh"
    $python = Exists "python"
    $node = Exists "node"
    $vercel = Exists "vercel"

    if ($ollama) {
      Log "Ollama detected"
      ollama list | Out-File $Log -Append
      ollama pull llama3.2 | Out-File $Log -Append
      ollama run llama3.2 "You are UAOS autonomous product agent. Suggest one improvement for the music AI landing page." | Out-File "$Repo\reports\LLAMA_SUGGESTION.txt" -Encoding utf8
    } else {
      Log "Ollama not found"
    }

    if (Test-Path "scripts\paypal-background-agent.ps1") {
      Log "Running PayPal/UI agent"
      powershell -ExecutionPolicy Bypass -File scripts\paypal-background-agent.ps1 | Out-File $Log -Append
    }

    if (Test-Path "scripts\build-agents-monitor.ps1") {
      Log "Updating monitor dashboard"
      powershell -ExecutionPolicy Bypass -File scripts\build-agents-monitor.ps1 | Out-File $Log -Append
    }

    if (Test-Path "ai-videos\make_better_demo_videos.py") {
      Log "Checking video generator"
      if (Test-Path "ai-videos\.venv_v2\Scripts\python.exe") {
        .\ai-videos\.venv_v2\Scripts\python.exe ai-videos\make_better_demo_videos.py | Out-File $Log -Append
      }
    }

    $videoCount = (Get-ChildItem "ai-videos\output_v2\*.mp4" -ErrorAction SilentlyContinue).Count
    $tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*UAOS*" } | Select-Object TaskName,State | Out-String
    $lastCommit = git log -1 --pretty=format:"%h - %s"

@"
UAOS MASTER AGENT STATUS

Time:
$(Get-Date)

Website:
https://sari-raslan.github.io/universal-arranger-os/

Payment:
https://www.paypal.com/ncp/payment/4PHMPZL66YEG8

Tools:
Git: $git
GitHub CLI: $gh
Python: $python
Node: $node
Vercel: $vercel
Ollama/Llama: $ollama

Videos:
$videoCount MP4 files

Scheduled UAOS Agents:
$tasks

Last Commit:
$lastCommit

Notes:
- Premium services like PayPal, Apple, Google Play, Vercel, Linear, or other paid agents require valid login/API credentials.
- This agent can run local tools automatically, but cannot bypass CAPTCHA, app-store approval, payment verification, or paid API permissions.
"@ | Out-File $Report -Encoding utf8

    git add . | Out-File $Log -Append
    git commit -m "UAOS master autonomous agent update" | Out-File $Log -Append
    git push | Out-File $Log -Append

    Log "===== CYCLE COMPLETE ====="
  }
  catch {
    Log "ERROR: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 1800
}
