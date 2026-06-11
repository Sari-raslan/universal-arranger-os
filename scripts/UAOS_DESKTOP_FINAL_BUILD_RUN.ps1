$Root=Split-Path -Parent $PSScriptRoot
Set-Location "$Root\desktop"

$Report="$Root\agent-output\UAOS_DESKTOP_FINAL_REPORT.txt"
"UAOS Desktop Final $(Get-Date)" | Set-Content $Report -Encoding UTF8
function Log($m){ $m | Tee-Object -FilePath $Report -Append }

Log "Install desktop dependencies"
npm install 2>&1 | Tee-Object -FilePath $Report -Append

Log "Start desktop app"
Start-Process powershell -ArgumentList @(
 "-NoExit",
 "-Command",
 "cd `"$Root\desktop`"; npm run start"
)

Log "Build portable desktop app"
npm run pack 2>&1 | Tee-Object -FilePath $Report -Append

Log "Desktop outputs:"
Get-ChildItem ".\dist" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName | Out-String | Tee-Object -FilePath $Report -Append

@"
# UAOS Desktop Commands

Run desktop:
cd "$Root\desktop"
npm install
npm run start

Build portable:
cd "$Root\desktop"
npm run pack

Output:
$Root\desktop\dist

Modes:
- Public live: https://universal-arranger-os.vercel.app
- Offline fallback: bundled local-app/index.html
"@ | Set-Content "$Root\release-kit\UAOS_DESKTOP_FINAL_COMMANDS.md" -Encoding UTF8

Start-Process "$Root\desktop\dist" -ErrorAction SilentlyContinue
notepad $Report
notepad "$Root\release-kit\UAOS_DESKTOP_FINAL_COMMANDS.md"
