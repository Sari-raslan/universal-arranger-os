$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$Log="agent-output\UAOS_BOOT_AGENT_ORCHESTRATOR.log"
"UAOS BOOT ORCHESTRATOR $(Get-Date)" | Set-Content $Log -Encoding UTF8

function L($m){ "$(Get-Date -Format HH:mm:ss) $m" | Tee-Object -FilePath $Log -Append }

L "Starting UAOS boot workflow"

git pull origin master 2>&1 | Tee-Object -FilePath $Log -Append
npm run build --prefix uaos-live-clean 2>&1 | Tee-Object -FilePath $Log -Append
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append

$Prompt=@"
Read AGENT_AUTO_ORCHESTRATION.md and run the workflow loop automatically.
Continue coding UAOS step by step.
Build after every change.
Commit source changes only.
Do not commit generated binaries.
Stop only on blocking errors.
"@

$Prompt | Set-Clipboard

$Cursor="$env:LOCALAPPDATA\Programs\Cursor\Cursor.exe"
$Code="$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe"

if(Test-Path $Cursor){ Start-Process $Cursor $Root }
if(Test-Path $Code){ Start-Process $Code $Root }

Start-Process ".\AGENT_AUTO_ORCHESTRATION.md"
Start-Process "https://universal-arranger-os.vercel.app"
Start-Process "https://universal-arranger-os.vercel.app/api/status"

notepad $Log

L "DONE. Cursor prompt copied to clipboard."
