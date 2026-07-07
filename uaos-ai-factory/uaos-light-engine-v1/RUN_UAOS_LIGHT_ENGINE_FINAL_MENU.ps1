$ErrorActionPreference="Stop"

$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$BaseUrl = "http://localhost:3000"

function Start-UAOSServerIfNeeded {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/music/status" -Method GET -TimeoutSec 2 | Out-Null
  } catch {
    Write-Host "Starting UAOS Light Engine server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd `"$Project`"; npm start"
    Start-Sleep -Seconds 4
  }
}

function Enable-UAOSFullRoom {
  $confirm = @{ confirm = "I UNDERSTAND FULL ROOM MUSIC OUTPUT" } | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri "$BaseUrl/api/music/enable-full-room" -Method POST -Body $confirm -ContentType "application/json" | Out-Null
}

function Start-UAOSMusicMode {
  param([string]$Preset,[double]$Sensitivity,[double]$BrightnessCap)
  $start = @{
    dryRun = $false
    preset = $Preset
    sensitivity = $Sensitivity
    brightnessCap = $BrightnessCap
  } | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri "$BaseUrl/api/music/start" -Method POST -Body $start -ContentType "application/json" | Out-Null
}

function Send-UAOSFrame {
  param([double]$Bass,[double]$Mid,[double]$Treble,[double]$Rms,[bool]$Beat,[string]$Preset,[double]$Sensitivity,[double]$BrightnessCap)
  $frame = @{
    bass = $Bass
    mid = $Mid
    treble = $Treble
    rms = $Rms
    beat = $Beat
    preset = $Preset
    sensitivity = $Sensitivity
    brightnessCap = $BrightnessCap
  } | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri "$BaseUrl/api/music/frame" -Method POST -Body $frame -ContentType "application/json" | Out-Null
}

function Stop-UAOSWarmWhite {
  Invoke-RestMethod -Uri "$BaseUrl/api/music/emergency-stop" -Method POST -Body "{}" -ContentType "application/json" | Out-Null
}

function Run-PartyMode {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Club" -Sensitivity 1.5 -BrightnessCap 0.9
  Write-Host ""
  Write-Host "PARTY MODE running. Press Ctrl+C to stop, then choose Emergency Stop." -ForegroundColor Green
  $i=0
  while ($true) {
    $beat = ($i % 4 -eq 0)
    if ($beat) { $bass=1.0; $rms=0.95 } else { $bass=0.35; $rms=0.35 }
    if ($i % 3 -eq 0) { $mid=0.8 } else { $mid=0.3 }
    if ($i % 5 -eq 0) { $treble=0.9 } else { $treble=0.25 }
    Send-UAOSFrame -Bass $bass -Mid $mid -Treble $treble -Rms $rms -Beat $beat -Preset "Club" -Sensitivity 1.5 -BrightnessCap 0.9
    Start-Sleep -Milliseconds 250
    $i++
  }
}

function Run-OrientalLive {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Oriental Live" -Sensitivity 1.15 -BrightnessCap 0.78
  Write-Host ""
  Write-Host "ORIENTAL LIVE running. Press Ctrl+C to stop, then choose Emergency Stop." -ForegroundColor Green
  $i=0
  while ($true) {
    $beat = ($i % 6 -eq 0)
    if ($beat) { $bass=0.85; $rms=0.72 } else { $bass=0.42; $rms=0.45 }
    if ($i % 2 -eq 0) { $mid=0.72 } else { $mid=0.45 }
    if ($i % 8 -eq 0) { $treble=0.45 } else { $treble=0.22 }
    Send-UAOSFrame -Bass $bass -Mid $mid -Treble $treble -Rms $rms -Beat $beat -Preset "Oriental Live" -Sensitivity 1.15 -BrightnessCap 0.78
    Start-Sleep -Milliseconds 300
    $i++
  }
}

function Run-CalmMode {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Calm" -Sensitivity 0.75 -BrightnessCap 0.45
  Write-Host ""
  Write-Host "CALM MODE running. Press Ctrl+C to stop, then choose Emergency Stop." -ForegroundColor Green
  $i=0
  while ($true) {
    $mid = 0.25 + 0.08 * [math]::Sin($i / 10)
    $rms = 0.22 + 0.05 * [math]::Sin($i / 15)
    Send-UAOSFrame -Bass 0.22 -Mid $mid -Treble 0.12 -Rms $rms -Beat $false -Preset "Calm" -Sensitivity 0.75 -BrightnessCap 0.45
    Start-Sleep -Milliseconds 500
    $i++
  }
}

function Run-EmergencyStop {
  Start-UAOSServerIfNeeded
  Write-Host ""
  Write-Host "Emergency Stop: Warm White 30% to all 18 lights..." -ForegroundColor Yellow
  Stop-UAOSWarmWhite
  Write-Host "PASS: Emergency Stop sent." -ForegroundColor Green
  Start-Sleep -Seconds 1
}

function Open-Dashboard {
  Start-UAOSServerIfNeeded
  Start-Process "$BaseUrl"
}

Set-Location $Project

while ($true) {
  Clear-Host
  Write-Host "====================================" -ForegroundColor Cyan
  Write-Host " UAOS Light Engine FINAL" -ForegroundColor Cyan
  Write-Host "====================================" -ForegroundColor Cyan
  Write-Host "1. Party Mode"
  Write-Host "2. Oriental Live"
  Write-Host "3. Calm Mode"
  Write-Host "4. Emergency Stop / Warm White 30%"
  Write-Host "5. Open Dashboard"
  Write-Host "6. Exit"
  Write-Host ""
  $choice = Read-Host "Choose 1-6"
  try {
    switch ($choice) {
      "1" { Run-PartyMode }
      "2" { Run-OrientalLive }
      "3" { Run-CalmMode }
      "4" { Run-EmergencyStop; Read-Host "Press ENTER" | Out-Null }
      "5" { Open-Dashboard; Read-Host "Press ENTER" | Out-Null }
      "6" { break }
      default { Write-Host "Invalid choice"; Start-Sleep -Seconds 1 }
    }
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "If lights are in a bad state, choose Emergency Stop." -ForegroundColor Yellow
    Read-Host "Press ENTER" | Out-Null
  }
}