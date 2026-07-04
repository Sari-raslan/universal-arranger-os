@echo off
echo UAOS V34 Summary
echo READ ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0decision_pack\analysis_outputs\V34_OWNER_DECISION_SUMMARY_AR.md" start "" "%~dp0decision_pack\analysis_outputs\V34_OWNER_DECISION_SUMMARY_AR.md"
if exist "%~dp0decision_pack\analysis_outputs\V34_REVIEW_ACTIONS.csv" start "" "%~dp0decision_pack\analysis_outputs\V34_REVIEW_ACTIONS.csv"
pause
