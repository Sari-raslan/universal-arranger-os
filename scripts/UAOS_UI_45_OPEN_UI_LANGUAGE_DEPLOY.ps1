$ErrorActionPreference="Stop"
&{
 Stop-Process -Name node -Force -ErrorAction SilentlyContinue
 Start-Sleep 2
 Start-Process powershell -ArgumentList '-NoExit','-Command','cd "C:\Users\ssare\keyboard-manager-clean\uaos-live-clean"; npm run dev -- --host 127.0.0.1 --port 5173 --force'
 Start-Sleep 5
 $Urls=@("http://127.0.0.1:5173/universal-arranger-os/","http://127.0.0.1:5173/universal-arranger-os/pages/marketing-ar.html","http://127.0.0.1:5173/universal-arranger-os/qa/ui-links-dashboard.html","http://127.0.0.1:5173/universal-arranger-os/launch/deploy-ready.html")
 foreach($u in $Urls){Start-Process $u}
}
