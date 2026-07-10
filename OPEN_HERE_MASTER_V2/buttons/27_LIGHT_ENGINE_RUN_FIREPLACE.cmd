@echo off
cd /d "E:\keyboard-manager-clean"
powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/v10/ambient/run' -Method Post -ContentType 'application/json' -Body '{\"effectId\":\"fireplace\",\"speed\":\"slow\",\"brightnessCap\":55,\"room\":\"full\"}'"
pause
