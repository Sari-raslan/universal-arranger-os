$ErrorActionPreference="Continue"
Set-Location "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Write-Host "Starting UAOS Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command','cd backend; npm start'

Start-Sleep 5

Write-Host "Starting UAOS Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command','cd frontend; npm run dev'

Start-Sleep 5

Start-Process "http://localhost:5173"
Start-Process "http://localhost:8090/health"
Start-Process "http://localhost:8090/scan"
