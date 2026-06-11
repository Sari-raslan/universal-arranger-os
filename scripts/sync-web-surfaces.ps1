$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "uaos-live-clean\dist"
$desktopTarget = Join-Path $root "desktop\local-app"
$androidTarget = Join-Path $root "mobile\android\app\src\main\assets\public"

function Reset-And-Copy($source, $target) {
  $sourcePath = (Resolve-Path $source).Path
  $targetRoot = Split-Path -Parent $target
  $targetFull = [System.IO.Path]::GetFullPath($target)
  $rootFull = [System.IO.Path]::GetFullPath($root)

  if (-not $targetFull.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to sync outside repo: $targetFull"
  }

  New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
  if (Test-Path $targetFull) {
    Remove-Item -LiteralPath $targetFull -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $targetFull | Out-Null
  Copy-Item -Path (Join-Path $sourcePath "*") -Destination $targetFull -Recurse -Force
}

if (-not (Test-Path (Join-Path $dist "index.html"))) {
  throw "Build output missing. Run npm run build first."
}

Reset-And-Copy $dist $desktopTarget
Reset-And-Copy $dist $androidTarget

Write-Host "Synced web dist to desktop/local-app and Android public assets."
