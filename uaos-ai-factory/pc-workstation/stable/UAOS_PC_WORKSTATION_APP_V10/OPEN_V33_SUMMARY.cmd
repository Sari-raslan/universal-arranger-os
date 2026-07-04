@echo off
echo UAOS V33 Summary
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0deep_analyzer\analysis_outputs\V33_DEEP_SET_SUMMARY_AR.md" start "" "%~dp0deep_analyzer\analysis_outputs\V33_DEEP_SET_SUMMARY_AR.md"
if exist "%~dp0deep_analyzer\analysis_outputs\V33_DEEP_SET_SUMMARY.json" start "" "%~dp0deep_analyzer\analysis_outputs\V33_DEEP_SET_SUMMARY.json"
pause
