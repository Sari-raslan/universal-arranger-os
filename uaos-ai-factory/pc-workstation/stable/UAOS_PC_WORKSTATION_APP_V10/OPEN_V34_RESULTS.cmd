@echo off
echo UAOS V34 Results
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0decision_pack\analysis_outputs" explorer "%~dp0decision_pack\analysis_outputs"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html"
pause
