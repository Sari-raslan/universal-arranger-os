@echo off
setlocal
title UAOS Program Tree Dashboard
cd /d C:\keyboard-manager-clean
start "" http://127.0.0.1:8787/
node "C:\keyboard-manager-clean\uaos-agent-factory\dashboard\program-tree-server.mjs"
pause
endlocal
