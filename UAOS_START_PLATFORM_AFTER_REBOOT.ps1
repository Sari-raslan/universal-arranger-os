$Repo = "C:\Users\ssare\Documents\Codex\2026-05-28\work-on-keyboard-manager-repository-sari"

cd $Repo

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\backend'; node server.js"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\backend'; node omr-server.js"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\frontend'; npm run dev"

Start-Sleep -Seconds 10

Start-Process "http://localhost:5173"
Start-Process "$Repo\public\launch\payment.html"
Start-Process "https://github.com/Sari-raslan/universal-arranger-os"
Start-Process "$Repo\release"
Start-Process "$Repo\android\app\build\outputs\apk\release"
Start-Process "$Repo\public\launch\uaos-invitation.png"

Unregister-ScheduledTask -TaskName "UAOS Launch Platform After Reboot" -Confirm:$false -ErrorAction SilentlyContinue
