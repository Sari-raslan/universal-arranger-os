$Repo = 'C:\Users\ssare\keyboard-manager-clean'

cd $Repo

Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$Repo\backend'; node src/server.js"
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$Repo\frontend'; npm run dev -- --host 0.0.0.0 --port 5173"

Start-Sleep -Seconds 8

Start-Process 'http://localhost:5173'
Start-Process 'http://localhost:5173/pricing'
Start-Process 'http://localhost:5173/status'
