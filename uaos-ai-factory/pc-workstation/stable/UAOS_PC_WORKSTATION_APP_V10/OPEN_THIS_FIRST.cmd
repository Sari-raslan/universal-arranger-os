@echo off
echo UAOS PC Workstation - Open This First
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V30.html"
if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" if exist "%~dp0UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html" start "" "%~dp0UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html"
if exist "%~dp0" explorer "%~dp0"
pause
