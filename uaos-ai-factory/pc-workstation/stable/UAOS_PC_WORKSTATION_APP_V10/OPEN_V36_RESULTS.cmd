@echo off
echo UAOS PC Workstation V36 Results
echo PC ONLY - NO USB - NO PA3X
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V36_CONFIRMED_RECOMMENDATIONS.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V36_CONFIRMED_RECOMMENDATIONS.html"
if exist "%~dp0confirmed_recommendations\analysis_outputs" explorer "%~dp0confirmed_recommendations\analysis_outputs"
pause
