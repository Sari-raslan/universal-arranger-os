@echo off
echo UAOS PC Workstation V35 Results
echo PC ONLY - NO USB - NO PA3X
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V35_OWNER_CONFIRMATION.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V35_OWNER_CONFIRMATION.html"
if exist "%~dp0owner_confirmation\analysis_outputs" explorer "%~dp0owner_confirmation\analysis_outputs"
pause
