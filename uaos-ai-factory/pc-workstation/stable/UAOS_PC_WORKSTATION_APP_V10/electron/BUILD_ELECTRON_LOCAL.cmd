@echo off
setlocal
echo UAOS PC Workstation Owner Beta - Local Electron Build
echo PC ONLY - NOT PA3X READY - DO NOT COPY TO USB
echo Output stays inside electron\dist-local. No publish. No installer upload.
cd /d "%~dp0"
npm run package:dir
endlocal
