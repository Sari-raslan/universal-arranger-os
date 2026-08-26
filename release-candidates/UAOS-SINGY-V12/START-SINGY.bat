@echo off
setlocal
cd /d "%~dp0"
title Singy
if not exist "RUNTIME\node\node.exe" (echo Missing RUNTIME\node\node.exe & pause & exit /b 1)
set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=5201
echo Starting Singy...
"RUNTIME\node\node.exe" "PRODUCT\launch.mjs"
if errorlevel 1 pause
