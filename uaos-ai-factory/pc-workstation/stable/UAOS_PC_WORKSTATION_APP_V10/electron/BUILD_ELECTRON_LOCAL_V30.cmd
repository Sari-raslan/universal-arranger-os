@echo off
setlocal
echo UAOS PC Workstation Electron Local Build V30
echo LOCAL ONLY - NO DEPLOY - NO PAYMENT - NO USB - NO PA3X
echo.
if not exist "%~dp0node_modules" (
  echo node_modules is missing. Build skipped. No install will run here.
  pause
  exit /b 1
)
pushd "%~dp0"
npm run package:dir
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
