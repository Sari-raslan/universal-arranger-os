@echo off
setlocal EnableExtensions
title UAOS V20 Cursor Leader
echo ==============================================
echo  UAOS V20 — Review Builds + Reproducible Integration
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V20_WINDOWS_REQUIRED & goto :hold)
if /I not "%COMPUTERNAME%"=="BOSS" (echo UAOS_V20_BOSS_HOST_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v20-cursor-leader.mjs"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
