@echo off
setlocal
cd /d "%~dp0"
echo PC ONLY - NOT PA3X READY - DO NOT COPY TO USB
echo UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER / NOT_COMPATIBILITY_VERIFIED
echo.
if not exist "node_modules\electron" (
  echo Electron dependency not installed. Scaffold ready only. No install performed.
  echo.
  pause
  exit /b 0
)
echo Electron dependency found locally. Starting scaffold without installing anything.
echo.
npx electron .
pause
