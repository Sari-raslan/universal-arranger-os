@echo off
setlocal EnableExtensions
title UAOS V15.1 Cursor Leader
echo ==============================================
echo  UAOS V15.1 — Commander Drift Reconciliation
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V15_1_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
if not exist "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-adoption-foundations\run-20260804-172830\V15-MASTER-STATUS.json" (
  echo UAOS_V15_1_V15_EVIDENCE_NOT_FOUND & goto :hold
)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-1-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-1-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-1-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal