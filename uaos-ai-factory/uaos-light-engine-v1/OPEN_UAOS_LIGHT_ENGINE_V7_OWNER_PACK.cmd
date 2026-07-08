@echo off
title UAOS Light Engine V7.2 Final Owner Pack
cd /d "%~dp0"

:menu
cls
echo ==================================================
echo      UAOS LIGHT ENGINE - FINAL DAILY READY
echo ==================================================
echo 1. Open UAOS Light Engine
echo 2. Party
echo 3. Oriental Live
echo 4. Calm
echo 5. White
echo 6. Yellow
echo 7. Night Mode
echo 8. Sleep Mode
echo 9. Candle
echo 10. Fireplace
echo 11. Romantic
echo 12. Cinema
echo 13. Reading
echo 14. Turn Off All Lights
echo 15. Emergency Stop
echo 16. Open V4 Advanced
echo 17. Repair / Check
echo 18. Exit
echo ==================================================
set /p c=Select: 

if "%c%"=="1" start "" "START_UAOS_LIGHT_ENGINE_SIMPLE.cmd"
if "%c%"=="2" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v4/scene/run' -Method Post -ContentType 'application/json' -Body '{\"sceneId\":\"party\"}'"
if "%c%"=="3" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v4/scene/run' -Method Post -ContentType 'application/json' -Body '{\"sceneId\":\"oriental_live\"}'"
if "%c%"=="4" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v4/scene/run' -Method Post -ContentType 'application/json' -Body '{\"sceneId\":\"calm\"}'"
if "%c%"=="5" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/lights/mode' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"white\"}'"
if "%c%"=="6" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/lights/mode' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"yellow\"}'"
if "%c%"=="7" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/lights/mode' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"night\"}'"
if "%c%"=="8" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/lights/mode' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"sleep\"}'"
if "%c%"=="9" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/filter' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"candle\"}'"
if "%c%"=="10" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/filter' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"fireplace\"}'"
if "%c%"=="11" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/filter' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"romantic\"}'"
if "%c%"=="12" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/filter' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"cinema\"}'"
if "%c%"=="13" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/filter' -Method Post -ContentType 'application/json' -Body '{\"mode\":\"reading\"}'"
if "%c%"=="14" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v5/lights/off' -Method Post"
if "%c%"=="15" powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v4/emergency-stop' -Method Post"
if "%c%"=="16" start "" "http://localhost:3000/src/ui/v4/index.html"
if "%c%"=="17" start "" powershell -NoExit -ExecutionPolicy Bypass -File "REPAIR_UAOS_LIGHT_ENGINE_SIMPLE.ps1"
if "%c%"=="18" exit

goto menu
