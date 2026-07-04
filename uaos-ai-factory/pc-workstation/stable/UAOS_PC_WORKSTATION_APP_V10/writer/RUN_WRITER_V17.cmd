@echo off
setlocal
cd /d "%~dp0"
echo UAOS PC Workstation Writer V17
echo PC_ONLY - NOT_FOR_PA3X_LOAD - NOT_FOR_USB_TRANSFER
echo.
python uaos_pc_workstation_writer_v17.py
echo.
pause
