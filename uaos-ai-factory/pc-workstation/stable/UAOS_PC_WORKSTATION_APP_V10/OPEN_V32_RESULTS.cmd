@echo off
echo UAOS V32 Results
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0results_dashboard\analysis_outputs" explorer "%~dp0results_dashboard\analysis_outputs"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html"
pause
