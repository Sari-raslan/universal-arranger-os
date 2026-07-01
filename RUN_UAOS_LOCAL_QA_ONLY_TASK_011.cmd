@echo off
setlocal
echo LOCAL QA ONLY - NO DEPLOY - NO EXPORT - NO KEYBOARD OUTPUT
cd /d "E:\keyboard-manager-clean\uaos-ai-factory\implementation\local-qa-entrypoint-task-011"
node runLocalQAOnly.js
set QA_EXIT=%ERRORLEVEL%
echo.
echo Local QA launcher exit code: %QA_EXIT%
pause
exit /b %QA_EXIT%
