$ErrorActionPreference = 'Stop'
$zip = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs\final-package\UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS_PACKAGE.zip'
if (!(Test-Path $zip)) { Write-Host 'PACKAGE_TEST: FAIL missing zip'; exit 1 }
if ((Get-Item $zip).Length -le 0) { Write-Host 'PACKAGE_TEST: FAIL empty zip'; exit 1 }
Write-Host 'PACKAGE_TEST: PASS'
exit 0
