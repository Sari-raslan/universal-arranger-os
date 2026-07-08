$ErrorActionPreference = "Stop"
$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"

Write-Host "UAOS Light Engine Desktop Installer" -ForegroundColor Cyan
$confirm = Read-Host "Create Desktop and Start Menu shortcuts? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
  Write-Host "Cancelled."
  pause
  exit
}

function New-UAOSShortcut {
  param([string]$ShortcutPath, [string]$TargetPath, [string]$WorkingDirectory, [string]$Description)
  $Wsh = New-Object -ComObject WScript.Shell
  $S = $Wsh.CreateShortcut($ShortcutPath)
  $S.TargetPath = $TargetPath
  $S.WorkingDirectory = $WorkingDirectory
  $S.Description = $Description
  $S.Save()
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\UAOS Light Engine"
New-Item -ItemType Directory -Force -Path $StartMenu | Out-Null

New-UAOSShortcut -ShortcutPath (Join-Path $Desktop "UAOS Light Engine.lnk") -TargetPath (Join-Path $Project "START_UAOS_LIGHT_ENGINE_SIMPLE.cmd") -WorkingDirectory $Project -Description "UAOS Light Engine Simple Daily App"
New-UAOSShortcut -ShortcutPath (Join-Path $StartMenu "UAOS Light Engine.lnk") -TargetPath (Join-Path $Project "START_UAOS_LIGHT_ENGINE_SIMPLE.cmd") -WorkingDirectory $Project -Description "UAOS Light Engine Simple Daily App"
New-UAOSShortcut -ShortcutPath (Join-Path $StartMenu "UAOS Light Engine Daily Pack.lnk") -TargetPath (Join-Path $Project "OPEN_UAOS_LIGHT_ENGINE_DAILY_PACK.cmd") -WorkingDirectory $Project -Description "UAOS Light Engine Daily Pack"

$repair = Join-Path $Project "REPAIR_UAOS_LIGHT_ENGINE_SIMPLE.ps1"
$repairShortcut = Join-Path $StartMenu "UAOS Light Engine Repair.lnk"
$Wsh = New-Object -ComObject WScript.Shell
$S = $Wsh.CreateShortcut($repairShortcut)
$S.TargetPath = "powershell.exe"
$S.Arguments = "-ExecutionPolicy Bypass -File `"$repair`""
$S.WorkingDirectory = $Project
$S.Description = "UAOS Light Engine Repair Tool"
$S.Save()

New-UAOSShortcut -ShortcutPath (Join-Path $StartMenu "UAOS Light Engine Advanced V4.lnk") -TargetPath (Join-Path $Project "START_UAOS_LIGHT_ENGINE_V4_PRO.cmd") -WorkingDirectory $Project -Description "UAOS Light Engine Advanced V4"

Write-Host "Shortcuts created." -ForegroundColor Green

$auto = Read-Host "Optional: enable autostart? (Y/N)"
if ($auto -eq "Y" -or $auto -eq "y") {
  $Startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\UAOS Light Engine.lnk"
  New-UAOSShortcut -ShortcutPath $Startup -TargetPath (Join-Path $Project "START_UAOS_LIGHT_ENGINE_SIMPLE.cmd") -WorkingDirectory $Project -Description "UAOS Light Engine Autostart"
  Write-Host "Autostart enabled." -ForegroundColor Green
} else {
  Write-Host "Autostart not enabled." -ForegroundColor Yellow
}
pause