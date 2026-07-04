@echo off
echo UAOS PC Workstation V35 Summary
echo PC ONLY - NO USB - NO PA3X
if exist "%~dp0owner_confirmation\analysis_outputs\V35_OWNER_CONFIRMATION_GUIDE_AR.md" start "" "%~dp0owner_confirmation\analysis_outputs\V35_OWNER_CONFIRMATION_GUIDE_AR.md"
if exist "%~dp0owner_confirmation\analysis_outputs\V35_RECOMMENDATION_UPGRADE_PLAN_AR.md" start "" "%~dp0owner_confirmation\analysis_outputs\V35_RECOMMENDATION_UPGRADE_PLAN_AR.md"
pause
