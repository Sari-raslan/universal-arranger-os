@echo off
cd /d C:\keyboard-manager-clean\uaos-agent-factory
echo [UAOS] Doctor...
call npm run doctor
if errorlevel 1 echo [UAOS] Doctor WARN — continuing with reduced packaging if needed
echo [UAOS] Init...
call npm run init
echo [UAOS] Start supervisor + dashboard...
call npm run start
echo [UAOS] Dashboard: http://127.0.0.1:17321
