$ErrorActionPreference="Stop"

$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$BaseUrl = "http://localhost:3000"

function Start-UAOSServerIfNeeded {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/music/status" -Method GET -TimeoutSec 2 | Out-Null
  } catch {
    Write-Host "Starting UAOS Light Engine server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-Command',"cd `"$Project`"; npm start"
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
Start-UAOSServerIfNeeded
Enable-UAOSFullRoom
Start-UAOSMusicMode -Preset "Club" -Sensitivity 1.5 -BrightnessCap 0.9

Write-Host "UAOS PARTY MODE running. Press Ctrl+C to stop. Then run RUN_UAOS_EMERGENCY_STOP.ps1" -ForegroundColor Green

$i = 0
while ($true) {
  $beat = ($i % 4 -eq 0)

  if ($beat) { $bass = 1.0; $rms = 0.95 } else { $bass = 0.35; $rms = 0.35 }
  if ($i % 3 -eq 0) { $mid = 0.8 } else { $mid = 0.3 }
  if ($i % 5 -eq 0) { $treble = 0.9 } else { $treble = 0.25 }

  Send-UAOSFrame -Bass $bass -Mid $mid -Treble $treble -Rms $rms -Beat $beat -Preset "Club" -Sensitivity 1.5 -BrightnessCap 0.9

  Start-Sleep -Milliseconds 250
  $i++
}
