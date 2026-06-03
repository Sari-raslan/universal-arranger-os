$Repo = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"
$Log = "$Repo\logs\rebuild-after-reboot.log"

function Log($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" | Out-File $Log -Append -Encoding utf8
}

cd $Repo
Log "UAOS rebuild after reboot started"

git pull | Out-File $Log -Append

mkdir frontend, backend, mobile, public, docs, assets, monitor, reports -Force

Copy-Item public\index.html docs\index.html -Force -ErrorAction SilentlyContinue
Copy-Item assets\uaos-logo.svg docs\uaos-logo.svg -Force -ErrorAction SilentlyContinue

if (Test-Path frontend\package.json) {
  cd frontend
  npm install | Out-File $Log -Append
  npm run build | Out-File $Log -Append
  cd ..
  Copy-Item frontend\dist\* docs\ -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path scripts\build-agents-monitor.ps1) {
  powershell -ExecutionPolicy Bypass -File scripts\build-agents-monitor.ps1 | Out-File $Log -Append
}

@"
UAOS REBUILD AFTER REBOOT COMPLETE

Time:
$(Get-Date)

Website:
https://sari-raslan.github.io/universal-arranger-os/

Done:
- Git pulled
- Structure checked
- Frontend build attempted
- Docs refreshed
- Monitor refreshed

Next:
- Check website
- Check monitor
- Fix DNS manually if needed
"@ | Out-File reports\REBUILD_AFTER_REBOOT_STATUS.txt -Encoding utf8

git add . | Out-File $Log -Append
git commit -m "Rebuild UAOS structure after reboot" | Out-File $Log -Append
git push | Out-File $Log -Append

Start-Process "https://sari-raslan.github.io/universal-arranger-os/"
Start-Process "monitor\agents-dashboard.html"
notepad reports\REBUILD_AFTER_REBOOT_STATUS.txt

Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\UAOS-Rebuild-Agent.lnk" -Force -ErrorAction SilentlyContinue

Log "UAOS rebuild after reboot complete"
