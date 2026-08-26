@echo off
setlocal
title UAOS Program Tree Leader
cd /d C:\keyboard-manager-clean
echo UAOS PROGRAM TREE LEADER
echo NO PUSH / NO MERGE / NO DEPLOY
echo COMMANDER NOT ACTIVATED
node "C:\keyboard-manager-clean\uaos-agent-factory\src\uaos-program-tree-leader.mjs"
echo.
echo Leader exited with code %ERRORLEVEL%
pause
endlocal
