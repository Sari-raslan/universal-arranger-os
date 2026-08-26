@echo off
setlocal EnableExtensions
title UAOS V21 Cursor Leader
echo ==============================================
echo  UAOS V21 — Owner Review Intake + Offline Render
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V21_WINDOWS_REQUIRED & goto :hold)
if /I not "%COMPUTERNAME%"=="BOSS" (echo UAOS_V21_BOSS_HOST_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v21-cursor-leader.mjs"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
