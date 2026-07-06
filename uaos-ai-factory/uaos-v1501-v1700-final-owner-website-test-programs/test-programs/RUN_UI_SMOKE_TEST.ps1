$ErrorActionPreference = 'Stop'
$site = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs\final-owner-site'
$index = Join-Path $site 'index.html'
$app = Join-Path $site 'app.js'
$css = Join-Path $site 'style.css'

$required = @(
  'btn-run-demo',
  'btn-run-safety',
  'btn-run-tests',
  'btn-open-package',
  'btn-open-report',
  'btn-reset-console',
  'btn-export-json',
  'btn-owner-flow'
)

$ok = $true
if (!(Test-Path $index)) { Write-Host 'Missing index.html'; $ok = $false }
if (!(Test-Path $app)) { Write-Host 'Missing app.js'; $ok = $false }
if (!(Test-Path $css)) { Write-Host 'Missing style.css'; $ok = $false }

$h = Get-Content $index -Raw
$j = Get-Content $app -Raw

foreach ($b in $required) {
  if ($h -notmatch $b -or $j -notmatch $b) {
    Write-Host "Missing or unwired button: $b"
    $ok = $false
  }
}

if ($ok) { Write-Host 'UI_SMOKE_TEST: PASS'; exit 0 }
else { Write-Host 'UI_SMOKE_TEST: FAIL'; exit 1 }
