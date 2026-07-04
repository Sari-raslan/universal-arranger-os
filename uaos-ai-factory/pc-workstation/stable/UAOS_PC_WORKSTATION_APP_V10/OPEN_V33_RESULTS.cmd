@echo off
echo UAOS V33 Results
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0deep_analyzer\analysis_outputs" explorer "%~dp0deep_analyzer\analysis_outputs"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html"
pause
