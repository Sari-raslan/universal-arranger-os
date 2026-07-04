@echo off
setlocal
echo UAOS PC Workstation Electron Local V29
echo LOCAL ONLY - NO DEPLOY - NO PAYMENT - NO USB - NO PA3X
echo.
set "EXE=%~dp0dist-local\win-unpacked\UAOS PC Workstation Owner Beta.exe"
if exist "%EXE%" (
  echo Local unpacked executable found:
  echo "%EXE%"
  echo.
  echo Manual action: double-click the executable above when you are ready.
  echo This script does not launch the app automatically.
  pause
  exit /b 0
)
echo Local unpacked executable was not found.
if exist "%~dp0node_modules" (
  echo node_modules is present.
  echo Manual fallback from this folder: npm start
  echo This script does not run npm start automatically.
  pause
  exit /b 1
)
echo node_modules is missing. No install or build will be attempted here.
pause
exit /b 1
