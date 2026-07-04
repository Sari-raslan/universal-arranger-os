@echo off
echo UAOS PC Workstation V36 Summary
echo PC ONLY - NO USB - NO PA3X
if exist "%~dp0confirmed_recommendations\analysis_outputs\V36_CONFIRMED_RECOMMENDATION_SUMMARY_AR.md" start "" "%~dp0confirmed_recommendations\analysis_outputs\V36_CONFIRMED_RECOMMENDATION_SUMMARY_AR.md"
if exist "%~dp0confirmed_recommendations\analysis_outputs\V36_NEXT_PRODUCT_STEP_AR.md" start "" "%~dp0confirmed_recommendations\analysis_outputs\V36_NEXT_PRODUCT_STEP_AR.md"
pause
