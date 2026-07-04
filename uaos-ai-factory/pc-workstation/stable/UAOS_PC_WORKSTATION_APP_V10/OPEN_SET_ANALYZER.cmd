@echo off
echo UAOS PC Workstation - Open SET Analyzer
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html"
if exist "%~dp0set_analyzer" explorer "%~dp0set_analyzer"
pause
