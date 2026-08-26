@echo off
setlocal
cd /d "%~dp0"
title UAOS Arranger — Final Owner Listening
echo.
echo ========================================
echo  ARRANGER FINAL MUSICAL REVIEW
echo  OWNER_DECISION_REQUIRED
echo ========================================
echo.
echo Listening guide: 02_ARRANGER_MUSICAL_REVIEW.md
echo Exact cards:     LISTENING_CARDS_ARRANGER.md
echo.
echo Opening frozen Arranger PRIVATE_PILOT_RC...
echo Do NOT modify package. Listen to A1-A5 only.
echo.
set "RC=%~dp0..\..\release-candidates\UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11"
if not exist "%RC%\START-UAOS-ARRANGER-STUDIO.bat" (
  echo ERROR: Arranger RC start not found at:
  echo   %RC%\START-UAOS-ARRANGER-STUDIO.bat
  echo Extract UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip if missing.
  pause
  exit /b 1
)
start "" notepad "%~dp0LISTENING_CARDS_ARRANGER.md"
cd /d "%RC%"
call "START-UAOS-ARRANGER-STUDIO.bat"
