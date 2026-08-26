@echo off
setlocal EnableExtensions
title UAOS V16 Cursor Leader
echo ==============================================
echo  UAOS V16 — Adoption Review + Product Core
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V16_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v16-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V16-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V16-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal