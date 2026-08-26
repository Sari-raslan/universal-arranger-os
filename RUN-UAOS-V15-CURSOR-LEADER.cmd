@echo off
setlocal EnableExtensions
title UAOS V15 Cursor Leader
echo ==============================================
echo  UAOS V15 — Adoption + Product Foundations
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V15_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
if not exist "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v14-1-worktree-continuation\run-20260804-155219\V14-1-MASTER-STATUS.json" (
  echo UAOS_V15_V14_1_EVIDENCE_NOT_FOUND & goto :hold
)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal