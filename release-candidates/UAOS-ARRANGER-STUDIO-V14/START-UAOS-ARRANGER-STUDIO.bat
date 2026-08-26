@echo off
setlocal
cd /d "%~dp0"
title UAOS Arranger Studio
if not exist "RUNTIME\node\node.exe" (
  echo.
  echo  UAOS Arranger Studio could not start.
  echo  Missing bundled runtime. Re-extract the product ZIP.
  echo.
  pause
  exit /b 1
)
set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=5199
echo.
echo  Starting UAOS Arranger Studio...
echo  If already open, your existing window will be reused.
echo.
"RUNTIME\node\node.exe" "PRODUCT\launch.mjs"
if errorlevel 1 (
  echo.
  echo  Could not start. See message above.
  echo  Tip: close other UAOS windows, wait 5 seconds, try again.
  echo  You do not need Task Manager for normal recovery.
  echo.
  pause
)
