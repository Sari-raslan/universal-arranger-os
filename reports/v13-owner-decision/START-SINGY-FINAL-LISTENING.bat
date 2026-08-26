@echo off
setlocal
cd /d "%~dp0"
title Singy — Final Owner Listening
echo.
echo ========================================
echo  SINGY FINAL MUSICAL REVIEW
echo  OWNER_DECISION_REQUIRED
echo ========================================
echo.
echo Listening guide: 03_SINGY_MUSICAL_REVIEW.md
echo Exact cards:     LISTENING_CARDS_SINGY.md
echo.
echo Opening frozen Singy PRIVATE_PILOT_RC...
echo Choose KIDS then TEEN. Listen to S1-S4 only.
echo.
set "RC=%~dp0..\..\release-candidates\UAOS-SINGY-V12"
if not exist "%RC%\START-SINGY.bat" (
  echo ERROR: Singy RC start not found at:
  echo   %RC%\START-SINGY.bat
  echo Extract UAOS_SINGY_FOUNDING_PILOT_V12.zip if missing.
  pause
  exit /b 1
)
start "" notepad "%~dp0LISTENING_CARDS_SINGY.md"
cd /d "%RC%"
call "START-SINGY.bat"
