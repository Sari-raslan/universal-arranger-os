@echo off
setlocal
cd /d "%~dp0"
title UAOS MIDI Toolkit
if not exist "RUNTIME\node\node.exe" (echo Missing RUNTIME\node\node.exe & pause & exit /b 1)
set UAOS_PILOT_ROOT=%~dp0
set UAOS_PILOT_DATA=%UAOS_PILOT_ROOT%DATA
set UAOS_PILOT_PORT=5200
echo Starting UAOS MIDI Toolkit...
"RUNTIME\node\node.exe" "PRODUCT\launch.mjs"
if errorlevel 1 pause
