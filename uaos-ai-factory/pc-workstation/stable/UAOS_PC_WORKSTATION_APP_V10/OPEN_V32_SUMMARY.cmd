@echo off
echo UAOS V32 Summary
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0results_dashboard\analysis_outputs\V32_OWNER_RESULTS_SUMMARY_AR.md" start "" "%~dp0results_dashboard\analysis_outputs\V32_OWNER_RESULTS_SUMMARY_AR.md"
if exist "%~dp0results_dashboard\analysis_outputs\V32_OWNER_RESULTS_SUMMARY.json" start "" "%~dp0results_dashboard\analysis_outputs\V32_OWNER_RESULTS_SUMMARY.json"
pause
