$ErrorActionPreference = "Stop"

$Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$PackDir = Join-Path $Root "uaos-ai-factory\jobcenter-send-ready"
$Staging = Join-Path $PackDir "_zip_staging_jobcenter_final"
$ZipPath = Join-Path $PackDir "UAOS_JOBCENTER_SEND_READY_2026-07-01_FINAL_OFFLINE.zip"

$Inputs = @(
  [pscustomobject]@{
    Source = Join-Path $PackDir "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf"
    Name = "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf"
  },
  [pscustomobject]@{
    Source = Join-Path $PackDir "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx"
    Name = "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx"
  },
  [pscustomobject]@{
    Source = Join-Path $PackDir "ppt-visual-proof\UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf"
    Name = "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf"
  }
)

foreach ($inputFile in $Inputs) {
  if (-not (Test-Path -LiteralPath $inputFile.Source)) {
    throw "Missing input file: $($inputFile.Source)"
  }
  if ((Get-Item -LiteralPath $inputFile.Source).Length -le 0) {
    throw "Input file is empty: $($inputFile.Source)"
  }
}

if (Test-Path -LiteralPath $Staging) {
  Remove-Item -LiteralPath $Staging -Recurse -Force
}
New-Item -ItemType Directory -Path $Staging -Force | Out-Null

foreach ($inputFile in $Inputs) {
  Copy-Item -LiteralPath $inputFile.Source -Destination (Join-Path $Staging $inputFile.Name) -Force
}

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($Staging, $ZipPath)

if (-not (Test-Path -LiteralPath $ZipPath)) {
  throw "ZIP was not created: $ZipPath"
}
if ((Get-Item -LiteralPath $ZipPath).Length -le 0) {
  throw "ZIP is empty: $ZipPath"
}

$expectedNames = @($Inputs | ForEach-Object { $_.Name })
$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  $entries = @($zip.Entries | ForEach-Object { $_.FullName })
  if ($entries.Count -ne 3) {
    throw "ZIP entry count mismatch. Expected 3, found $($entries.Count): $($entries -join ', ')"
  }
  foreach ($expected in $expectedNames) {
    if ($entries -notcontains $expected) {
      throw "ZIP missing expected entry: $expected"
    }
  }
} finally {
  $zip.Dispose()
}

Remove-Item -LiteralPath $Staging -Recurse -Force

Write-Output "UAOS Jobcenter Final Offline ZIP"
Write-Output "Status: PASS"
Write-Output "ZIP: $ZipPath"
Write-Output "Entries: 3"
foreach ($name in $expectedNames) {
  Write-Output " - $name"
}
