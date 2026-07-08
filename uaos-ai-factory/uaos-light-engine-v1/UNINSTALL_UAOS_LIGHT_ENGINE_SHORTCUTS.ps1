$ErrorActionPreference = "Continue"

Write-Host "UAOS Light Engine Shortcut Uninstaller" -ForegroundColor Cyan
$confirm = Read-Host "Remove only UAOS Light Engine shortcuts? Project files stay untouched. (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
  Write-Host "Cancelled."
  pause
  exit
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\UAOS Light Engine"
$Startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\UAOS Light Engine.lnk"

$items = @((Join-Path $Desktop "UAOS Light Engine.lnk"), $Startup)

foreach ($i in $items) {
  if (Test-Path $i) {
    Remove-Item $i -Force
    Write-Host "Removed: $i" -ForegroundColor Yellow
  }
}

if (Test-Path $StartMenu) {
  Remove-Item $StartMenu -Recurse -Force
  Write-Host "Removed Start Menu folder: $StartMenu" -ForegroundColor Yellow
}

Write-Host "Done. Project files, backups, Hue token/config were not touched." -ForegroundColor Green
pause