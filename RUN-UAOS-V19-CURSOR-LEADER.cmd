@echo off
setlocal EnableExtensions
title UAOS V19 Cursor Leader
echo ==============================================
echo  UAOS V19 — Integrated Candidates + Runtime
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V19_WINDOWS_REQUIRED & goto :hold)
if /I not "%COMPUTERNAME%"=="BOSS" (echo UAOS_V19_BOSS_HOST_REQUIRED host=%COMPUTERNAME% & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v19-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V19-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V19-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
