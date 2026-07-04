@echo off
setlocal
echo UAOS PC Workstation Electron Local V30
echo LOCAL ONLY - NO DEPLOY - NO PAYMENT - NO USB - NO PA3X
echo.
set "EXE=%~dp0dist-local\win-unpacked\UAOS PC Workstation Owner Beta.exe"
if exist "%EXE%" (
  echo Starting local unpacked Electron app:
  echo "%EXE%"
  start "" "%EXE%"
  exit /b 0
)
if exist "%~dp0node_modules" (
  echo Local executable not found. node_modules exists, starting Electron dev mode.
  pushd "%~dp0"
  npm start
  popd
  exit /b %ERRORLEVEL%
)
echo Local executable and node_modules are missing.
echo No install, no build, no deploy.
pause
exit /b 1
