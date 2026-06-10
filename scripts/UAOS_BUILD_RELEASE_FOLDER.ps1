
$Repo = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Release = "$HOME\Desktop\UAOS_HyperStation_Release"

Remove-Item $Release -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $Release | Out-Null
New-Item -ItemType Directory -Force "$Release\scripts","$Release\docs","$Release\reports" | Out-Null

Copy-Item "$Repo\scripts\*.ps1" "$Release\scripts" -Force -ErrorAction SilentlyContinue
Copy-Item "$Repo\docs\*" "$Release\docs" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Repo\reports\*" "$Release\reports" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Repo\control-panel" "$Release\control-panel" -Recurse -Force -ErrorAction SilentlyContinue

@"
UAOS HyperStation Release

Start:
powershell -ExecutionPolicy Bypass -File "$Repo\scripts\UAOS_START_ALL.ps1"

Runtime:
http://localhost:8090/health
http://localhost:8090/runtime
http://localhost:8090/runtime/release-gate

Branch:
v2/core-runtime-alpha

Production V1:
https://keyboard-manager-clean-liard.vercel.app
"@ | Set-Content "$Release\START_HERE.txt" -Encoding UTF8

Start-Process $Release
