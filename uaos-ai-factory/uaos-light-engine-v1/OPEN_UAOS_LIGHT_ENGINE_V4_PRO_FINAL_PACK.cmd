@echo off
title UAOS Light Engine V4 PRO - Final Pack Access
cd /d "%~dp0"

:menu
cls
echo =========================================================
echo       UAOS LIGHT ENGINE V4 PRO - FINAL HANDOFF
echo =========================================================
echo 1. Launch V4 PRO Controller
echo 2. Open Web Dashboard
echo 3. Read Owner Start Guide
echo 4. View Final Validation Seal
echo 5. Open Backup Folder
echo 6. EMERGENCY STOP
echo 7. Exit
echo =========================================================
set /p choice=Select: 

if "%choice%"=="1" start "" "START_UAOS_LIGHT_ENGINE_V4_PRO.cmd"
if "%choice%"=="2" start "" "http://localhost:3000/src/ui/v4/index.html"
if "%choice%"=="3" start notepad "generated\UAOS_LIGHT_ENGINE_V4_PRO_OWNER_START_HERE.md"
if "%choice%"=="4" start notepad "generated\UAOS_LIGHT_ENGINE_V4_PRO_FINAL_SEAL.md"
if "%choice%"=="5" start explorer "E:\UAOS_LIGHT_ENGINE_V4_PRO_FINAL_BACKUP"
if "%choice%"=="6" powershell -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Uri 'http://localhost:3000/api/v4/emergency-stop' -Method Post; Write-Host 'Emergency Stop sent.' -ForegroundColor Green } catch { Write-Host 'Server not reachable. Start server first.' -ForegroundColor Red }; pause"
if "%choice%"=="7" exit

goto menu
