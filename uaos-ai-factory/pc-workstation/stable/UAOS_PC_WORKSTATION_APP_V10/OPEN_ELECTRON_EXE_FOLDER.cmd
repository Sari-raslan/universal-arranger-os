@echo off
echo UAOS PC Workstation - Open Electron EXE Folder
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0electron\dist-local\win-unpacked" explorer "%~dp0electron\dist-local\win-unpacked"
pause
