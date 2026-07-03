@echo off
echo Run 042 USB detector only.
echo This wrapper runs read-only detection and writes the result JSON only inside the Run 042 report folder.
echo It does not copy files to USB and does not load PA3X.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DETECT_AND_VERIFY_EMPTY_USB_RUN_042.ps1"
exit /b %ERRORLEVEL%
