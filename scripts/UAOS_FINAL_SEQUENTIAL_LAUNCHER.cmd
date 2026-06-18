@echo off
set "REPO=C:\UAOSN20260617-000536\wt"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%REPO%\scripts\UAOS_FINAL_SEQUENTIAL_LAUNCHER.ps1" -RepoPath "%REPO%"
pause