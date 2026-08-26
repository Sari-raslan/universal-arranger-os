@echo off
setlocal
REM UAOS C-drive emergency rescue launcher.
REM Requests Administrator. Does not force-kill. Does not touch product source.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0scripts\uaos-c-drive-rescue.ps1\"'"
if errorlevel 1 (
  echo Elevation failed or was declined. Running the same rescue without Administrator.
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uaos-c-drive-rescue.ps1"
)
exit /b 0
