@echo off
echo UAOS PC Workstation V20
echo PC ONLY - NOT PA3X READY - DO NOT COPY TO USB
set "APP=%~dp0UAOS_PC_WORKSTATION_APP_V20.html"
if not exist "%APP%" (
  echo Missing V20 app: %APP%
  pause
  exit /b 1
)
start "" "%APP%"
