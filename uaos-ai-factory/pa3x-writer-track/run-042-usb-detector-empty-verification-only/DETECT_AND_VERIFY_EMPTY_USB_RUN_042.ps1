param(
  [string]$UsbRoot = '',
  [string]$OutputJson = ''
)

$ErrorActionPreference = 'Stop'

$RunRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($OutputJson)) {
  $OutputJson = Join-Path $RunRoot 'UAOS_PA3X_RUN_042_USB_DETECTOR_RESULTS.json'
}

function Convert-ToFullPath([string]$PathValue) {
  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return ''
  }
  return [System.IO.Path]::GetFullPath($PathValue)
}

$selectedUsbRoot = Convert-ToFullPath $UsbRoot
$outputJsonFull = Convert-ToFullPath $OutputJson

if (-not [string]::IsNullOrWhiteSpace($selectedUsbRoot)) {
  if ($outputJsonFull.StartsWith($selectedUsbRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'OutputJson must not be written to the selected USB path. No verification result was written.'
  }
}

$removableDrives = @(Get-CimInstance Win32_LogicalDisk |
  Where-Object { $_.DriveType -eq 2 } |
  Sort-Object DeviceID |
  ForEach-Object {
    [PSCustomObject]@{
      deviceId = $_.DeviceID
      volumeName = $_.VolumeName
      fileSystem = $_.FileSystem
      sizeBytes = if ($null -eq $_.Size) { $null } else { [int64]$_.Size }
      freeBytes = if ($null -eq $_.FreeSpace) { $null } else { [int64]$_.FreeSpace }
    }
  })

$selected = $null
if (-not [string]::IsNullOrWhiteSpace($selectedUsbRoot)) {
  $exists = Test-Path -LiteralPath $selectedUsbRoot -PathType Container
  $itemCount = $null
  $isEmpty = $false
  $driveType = $null
  $driveRoot = ''

  if ($exists) {
    $driveRoot = [System.IO.Path]::GetPathRoot($selectedUsbRoot)
    $driveId = $driveRoot.TrimEnd('\')
    $drive = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $driveId } | Select-Object -First 1
    if ($null -ne $drive) {
      $driveType = [int]$drive.DriveType
    }
    $items = Get-ChildItem -LiteralPath $selectedUsbRoot -Force
    $itemCount = @($items).Count
    $isEmpty = $itemCount -eq 0
  }

  $selected = [PSCustomObject]@{
    path = $selectedUsbRoot
    exists = $exists
    driveRoot = $driveRoot
    driveType = $driveType
    isRemovableDrive = $driveType -eq 2
    itemCount = $itemCount
    isEmpty = $isEmpty
  }
}

$result = [PSCustomObject]@{
  status = 'PASS'
  run = '042'
  scope = 'USB_DETECTOR_EMPTY_VERIFICATION_ONLY'
  usbWritePerformed = $false
  keyboardTransferPerformed = $false
  pa3xLoadPerformed = $false
  overwritePerformed = $false
  fixtureModified = $false
  appJsModified = $false
  copyScriptExecuted = $false
  detectedRemovableDriveCount = $removableDrives.Count
  removableDrives = $removableDrives
  selectedPathVerification = $selected
}

$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outputJsonFull -Encoding UTF8
$result | ConvertTo-Json -Depth 6
