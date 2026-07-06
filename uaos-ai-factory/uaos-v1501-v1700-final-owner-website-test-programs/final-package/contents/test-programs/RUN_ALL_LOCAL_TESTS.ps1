$ErrorActionPreference = 'Continue'
$programPath = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs\test-programs'
$reportPath = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs\reports'
New-Item -ItemType Directory -Path $reportPath -Force | Out-Null

$tests = @(
  'RUN_UI_SMOKE_TEST.ps1',
  'RUN_SAFETY_TEST.ps1',
  'RUN_PACKAGE_TEST.ps1'
)

$results = @()
$allPass = $true

foreach ($t in $tests) {
  $p = Join-Path $programPath $t
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $p
  $pass = ($LASTEXITCODE -eq 0)
  if (!$pass) { $allPass = $false }
  $results += [ordered]@{ test=$t; pass=$pass; exit_code=$LASTEXITCODE }
}

$summary = [ordered]@{
  status = if ($allPass) { 'PASS' } else { 'FAIL' }
  results = $results
  checked_at = Get-Date -Format 'o'
}

$summary | ConvertTo-Json -Depth 20 | Out-File (Join-Path $reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.json') -Encoding UTF8

$md = "# UAOS V1501-V1700 Test Program Results

Status: **$($summary.status)**

"
foreach ($r in $results) {
  $md += "- $($r.test): $($r.pass)
"
}
$md | Out-File (Join-Path $reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.md') -Encoding UTF8

Write-Host "ALL_LOCAL_TESTS: $($summary.status)"
if ($allPass) { exit 0 } else { exit 1 }
