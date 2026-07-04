@echo off
echo UAOS V32 Tables
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0results_dashboard\analysis_outputs\V32_FILE_CATEGORY_TABLE.csv" start "" "%~dp0results_dashboard\analysis_outputs\V32_FILE_CATEGORY_TABLE.csv"
if exist "%~dp0results_dashboard\analysis_outputs\V32_MANUAL_REVIEW_TABLE.csv" start "" "%~dp0results_dashboard\analysis_outputs\V32_MANUAL_REVIEW_TABLE.csv"
pause
