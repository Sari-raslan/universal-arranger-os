$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force agent-output | Out-Null

while ($true) {
  $Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
  $Log="agent-output\UAOS_BACKGROUND_$Stamp.log"

  "=== UAOS BACKGROUND WATCHER ===" | Tee-Object -FilePath $Log
  "Time: $(Get-Date)" | Tee-Object -FilePath $Log -Append

  npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append

  $Port = netstat -ano | findstr ":5173"
  $Port | Tee-Object -FilePath $Log -Append

  if (-not $Port) {
    $Cmd = "cd '$Root\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5173"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -Command `"$Cmd`""
  }

  Start-Sleep -Seconds 60
}
