$ErrorActionPreference="Stop"
&{
 $A="C:\Users\ssare\keyboard-manager-clean\uaos-live-clean"
 Stop-Process -Name node -Force -ErrorAction SilentlyContinue
 Start-Sleep 2
 Start-Process powershell -ArgumentList '-NoExit','-Command','cd "C:\Users\ssare\keyboard-manager-clean\uaos-live-clean"; npm run dev -- --host 127.0.0.1 --port 5173 --force'
 Start-Sleep 5
 $U=@("http://127.0.0.1:5173/universal-arranger-os/","http://127.0.0.1:5173/universal-arranger-os/launch/status.html","http://127.0.0.1:5173/universal-arranger-os/qa/dashboard.html","http://127.0.0.1:5173/universal-arranger-os/downloads/index.html")
 foreach($x in $U){Start-Process $x}
}
