@echo off
setlocal EnableExtensions
title UAOS V11 Cursor Leader
echo ==============================================
echo  UAOS V11 — Cursor Clean-Baseline Leader
echo ==============================================
if /I not "%OS%"=="Windows_NT" (
  echo UAOS_V11_WINDOWS_REQUIRED
  goto :hold
)
where node >nul 2>&1
if errorlevel 1 (
  echo NODE_NOT_FOUND
  goto :hold
)
git -C "C:\keyboard-manager-clean" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo UAOS_V11_REPOSITORY_INVALID
  goto :hold
)
git -C "C:\keyboard-manager-clean" cat-file -t 6cde73d >nul 2>&1
if errorlevel 1 (
  echo.
  echo UAOS_V11_BASELINE_COMMIT_NOT_FOUND
  echo Required commit 6cde73d is NOT in C:\keyboard-manager-clean
  echo Dirty working tree is protected. No checkout/restore/clean/stash.
  echo.
  node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-cursor-leader.mjs"
  echo.
  if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md" (
    start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md"
  )
  goto :hold
)
echo Baseline 6cde73d verified in keyboard-manager-clean.
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md" (
  start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md"
)
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal