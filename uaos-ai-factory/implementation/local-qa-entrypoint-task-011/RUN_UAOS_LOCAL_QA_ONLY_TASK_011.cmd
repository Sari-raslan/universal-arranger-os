@echo off
setlocal
echo LOCAL QA ONLY - NO DEPLOY - NO EXPORT - NO KEYBOARD OUTPUT
cd /d "%~dp0"
node runLocalQAOnly.js
set QA_EXIT=%ERRORLEVEL%
echo.
echo Local QA launcher exit code: %QA_EXIT%
pause
exit /b %QA_EXIT%
