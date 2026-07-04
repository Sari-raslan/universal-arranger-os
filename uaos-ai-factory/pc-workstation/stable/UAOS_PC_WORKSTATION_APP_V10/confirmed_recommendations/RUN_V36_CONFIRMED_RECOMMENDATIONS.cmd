@echo off
echo UAOS PC Workstation V36 Confirmed Recommendations
echo PC ONLY - NO USB - NO PA3X
python "%~dp0uaos_v36_confirmed_recommendation_engine.py"
if exist "%~dp0analysis_outputs" explorer "%~dp0analysis_outputs"
pause
