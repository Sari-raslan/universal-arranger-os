@echo off
echo UAOS PC Workstation - Open Main App
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V30.html"
if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" if exist "%~dp0UAOS_PC_WORKSTATION_APP_V25.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V25.html"
if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V25.html" if exist "%~dp0UAOS_PC_WORKSTATION_APP_V23.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V23.html"
if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V25.html" if not exist "%~dp0UAOS_PC_WORKSTATION_APP_V23.html" if exist "%~dp0UAOS_PC_WORKSTATION_HOME.html" start "" "%~dp0UAOS_PC_WORKSTATION_HOME.html"
pause
