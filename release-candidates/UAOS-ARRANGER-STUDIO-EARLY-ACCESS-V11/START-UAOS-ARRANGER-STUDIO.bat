@echo off
setlocal
cd /d "%~dp0"
title UAOS Arranger Studio — Founding Pilot

if not exist "RUNTIME\node\node.exe" (
  echo.
  echo  UAOS Arranger Studio could not start.
  echo  Missing bundled runtime in RUNTIME\node\
  echo  See QUICK_START\README.txt
  echo.
  pause
  exit /b 1
)

set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=5199

echo Starting UAOS Arranger Studio...
"RUNTIME\node\node.exe" "PRODUCT\launch.mjs"
if errorlevel 1 (
  echo.
  echo  Pilot exited with an error.
  pause
)
