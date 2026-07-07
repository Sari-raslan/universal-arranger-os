$ErrorActionPreference="Stop"

$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$BaseUrl = "http://localhost:3000"

$PrimarySync10 = @("10","11","12","13","14","15","16","17","18","19")
$Ambient8 = @("20","21","22","23","24","25","26","27")
$All18 = $PrimarySync10 + $Ambient8

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
  param(
    [double]$Bass,
    [double]$Mid,
    [double]$Treble,
    [double]$Rms,
    [bool]$Beat,
    [string]$Preset,
    [double]$Sensitivity,
    [double]$BrightnessCap
  )

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

function Send-HueDirectState {
  param([string]$LightId, $State)
  $cfg = Get-Content "$Project\src\config\default-config.json" -Raw | ConvertFrom-Json
  $b = $cfg.hue.bridges[0]
  $body = $State | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri "http://$($b.ip)/api/$($b.username)/lights/$LightId/state" -Method PUT -Body $body -ContentType "application/json" -TimeoutSec 4 | Out-Null
}

function Stop-UAOSWarmWhite {
  Invoke-RestMethod -Uri "$BaseUrl/api/music/emergency-stop" -Method POST -Body "{}" -ContentType "application/json" | Out-Null
}

function Send-Ambient8 {
  param([int]$Tick, [string]$Mode)
  foreach ($id in $Ambient8) {
    if ($Mode -eq "Calm") {
      $state = @{ on=$true; bri=70; ct=366; transitiontime=8 }
    } elseif ($Mode -eq "Oriental") {
      if ($Tick % 2 -eq 0) { $state = @{ on=$true; bri=100; hue=8000; sat=150; transitiontime=6 } }
      else { $state = @{ on=$true; bri=85; ct=366; transitiontime=6 } }
    } else {
      if ($Tick % 2 -eq 0) { $state = @{ on=$true; bri=110; hue=46920; sat=160; transitiontime=5 } }
      else { $state = @{ on=$true; bri=90; hue=56100; sat=140; transitiontime=5 } }
    }
    Send-HueDirectState -LightId $id -State $state
    Start-Sleep -Milliseconds 120
  }
}

function Run-PartyHybrid {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Club" -Sensitivity 1.55 -BrightnessCap 0.80
  Write-Host ""
  Write-Host "V3 PARTY HYBRID: 10 fast sync + 8 ambient. Ctrl+C to stop." -ForegroundColor Green

  $i=0
  while ($true) {
    $beat = ($i % 4 -eq 0)
    if ($beat) { $bass=1.0; $rms=0.92 } else { $bass=0.38; $rms=0.34 }
    if ($i % 3 -eq 0) { $mid=0.82 } else { $mid=0.28 }
    if ($i % 5 -eq 0) { $treble=0.95 } else { $treble=0.25 }

    Send-UAOSFrame -Bass $bass -Mid $mid -Treble $treble -Rms $rms -Beat $beat -Preset "Club" -Sensitivity 1.55 -BrightnessCap 0.80

    if ($i % 24 -eq 0) { Send-Ambient8 -Tick $i -Mode "Party" }
    Start-Sleep -Milliseconds 220
    $i++
  }
}

function Run-OrientalHybrid {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Oriental Live" -Sensitivity 1.15 -BrightnessCap 0.78
  Write-Host ""
  Write-Host "V3 ORIENTAL HYBRID: 10 fast + 8 warm ambient. Ctrl+C to stop." -ForegroundColor Green

  $i=0
  while ($true) {
    $beat = ($i % 6 -eq 0)
    if ($beat) { $bass=0.88; $rms=0.70 } else { $bass=0.42; $rms=0.42 }
    if ($i % 2 -eq 0) { $mid=0.75 } else { $mid=0.45 }
    if ($i % 8 -eq 0) { $treble=0.42 } else { $treble=0.20 }

    Send-UAOSFrame -Bass $bass -Mid $mid -Treble $treble -Rms $rms -Beat $beat -Preset "Oriental Live" -Sensitivity 1.15 -BrightnessCap 0.78

    if ($i % 20 -eq 0) { Send-Ambient8 -Tick $i -Mode "Oriental" }
    Start-Sleep -Milliseconds 280
    $i++
  }
}

function Run-CalmAmbient {
  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Calm" -Sensitivity 0.7 -BrightnessCap 0.45
  Write-Host ""
  Write-Host "V3 CALM FULL ROOM AMBIENT. Ctrl+C to stop." -ForegroundColor Green

  $i=0
  while ($true) {
    $mid = 0.25 + 0.08 * [math]::Sin($i / 10)
    $rms = 0.22 + 0.05 * [math]::Sin($i / 15)
    Send-UAOSFrame -Bass 0.22 -Mid $mid -Treble 0.12 -Rms $rms -Beat $false -Preset "Calm" -Sensitivity 0.70 -BrightnessCap 0.45
    if ($i % 10 -eq 0) { Send-Ambient8 -Tick $i -Mode "Calm" }
    Start-Sleep -Milliseconds 500
    $i++
  }
}

function Run-ManualBpm {
  $bpm = Read-Host "BPM [120]"
  if (-not $bpm) { $bpm = 120 }
  $bpm = [double]$bpm
  $interval = [math]::Max(120, [math]::Round(60000 / $bpm))
  $intensity = Read-Host "Intensity 0.1-1.0 [0.75]"
  if (-not $intensity) { $intensity = 0.75 }
  $intensity = [double]$intensity

  Start-UAOSServerIfNeeded
  Enable-UAOSFullRoom
  Start-UAOSMusicMode -Preset "Club" -Sensitivity 1.25 -BrightnessCap 0.80
  Write-Host ""
  Write-Host "V3 MANUAL BPM running at $bpm BPM / interval ${interval}ms. Ctrl+C to stop." -ForegroundColor Green

  $i=0
  while ($true) {
    $beat = ($i % 4 -eq 0)
    Send-UAOSFrame -Bass $intensity -Mid ($intensity * 0.65) -Treble ($intensity * 0.55) -Rms $intensity -Beat $beat -Preset "Club" -Sensitivity 1.25 -BrightnessCap 0.80
    if ($i % 16 -eq 0) { Send-Ambient8 -Tick $i -Mode "Party" }
    Start-Sleep -Milliseconds $interval
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
  Write-Host " UAOS Light Engine V3 HYBRID SYNC PRO" -ForegroundColor Cyan
  Write-Host "====================================" -ForegroundColor Cyan
  Write-Host "1. Party Mode Fast 10 + Ambient 8"
  Write-Host "2. Oriental Live Fast 10 + Ambient 8"
  Write-Host "3. Calm Full Room Ambient"
  Write-Host "4. Manual BPM Mode"
  Write-Host "5. Emergency Stop / Warm White 30%"
  Write-Host "6. Open Dashboard"
  Write-Host "7. Exit"
  Write-Host ""
  $choice = Read-Host "Choose 1-7"
  try {
    switch ($choice) {
      "1" { Run-PartyHybrid }
      "2" { Run-OrientalHybrid }
      "3" { Run-CalmAmbient }
      "4" { Run-ManualBpm }
      "5" { Run-EmergencyStop; Read-Host "Press ENTER" | Out-Null }
      "6" { Open-Dashboard; Read-Host "Press ENTER" | Out-Null }
      "7" { break }
      default { Write-Host "Invalid choice"; Start-Sleep -Seconds 1 }
    }
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "If lights are in a bad state, choose Emergency Stop." -ForegroundColor Yellow
    Read-Host "Press ENTER" | Out-Null
  }
}