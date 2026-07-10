@echo off
title UAOS Light Engine V10 Ambient Magic
cd /d "%~dp0"
echo REAL_HUE_READY
echo AMBIENT_MAGIC_READY
echo Turn Off available
echo Emergency Stop available
start "UAOS Light Engine Server" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '%~dp0'; npm start"
timeout /t 3 >nul
if exist "%~dp0src\ui\v10\index.html" (
  start "" "http://localhost:3000/src/ui/v10/index.html#ambient"
) else (
  start "" "http://localhost:3000/src/ui/v5/index.html"
)
