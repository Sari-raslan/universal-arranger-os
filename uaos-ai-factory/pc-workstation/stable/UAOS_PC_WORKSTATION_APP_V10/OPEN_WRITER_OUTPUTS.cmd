@echo off
echo UAOS PC Workstation - Open Writer Outputs
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0writer\generated_v17_outputs" explorer "%~dp0writer\generated_v17_outputs"
pause
