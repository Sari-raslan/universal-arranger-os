@echo off
setlocal
echo UAOS PC Workstation Electron V29 Smoke Test
echo LOCAL ONLY - NO DEPLOY - NO PAYMENT - NO USB - NO PA3X
echo.
set "FAIL=0"
set "WARN=0"
call :check "%~dp0package.json" "package.json"
call :check "%~dp0main.js" "main.js"
call :check "%~dp0preload.js" "preload.js"
call :check "%~dp0node_modules" "node_modules"
call :check "%~dp0dist-local\win-unpacked" "dist-local\win-unpacked"
call :check "%~dp0dist-local\win-unpacked\UAOS PC Workstation Owner Beta.exe" "unpacked executable"
call :check "%~dp0..\UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html" "owner beta home V27"
call :check "%~dp0..\UAOS_PC_WORKSTATION_APP_V25.html" "V25 app fallback"
call :check "%~dp0..\UAOS_PC_WORKSTATION_APP_V23.html" "V23 app"
echo.
echo Electron launch: SKIPPED - file checks only.
if "%FAIL%"=="0" (
  if "%WARN%"=="0" (
    echo Result: PASS
    pause
    exit /b 0
  )
  echo Result: WARN
  pause
  exit /b 2
)
echo Result: FAIL
pause
exit /b 1

:check
if exist "%~1" (
  echo PASS: %~2
) else (
  echo FAIL: %~2
  set "FAIL=1"
)
exit /b 0
