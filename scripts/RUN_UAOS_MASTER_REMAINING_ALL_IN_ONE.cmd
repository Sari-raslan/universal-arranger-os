@echo off
title UAOS ALL IN ONE MASTER LAUNCHER
cd /d "%~dp0.."
echo Running UAOS Master Remaining Verification Script...
powershell -ExecutionPolicy Bypass -File scripts\UAOS_MASTER_REMAINING_ALL_IN_ONE.ps1
pause
