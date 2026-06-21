# UAOS R1 Fixture Collector

Status: PASS

This phase indexes fixture metadata only.

It does not:
- copy fixture files
- delete files
- parse proprietary binary content
- generate .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST files

To scan specific folders, run PowerShell with environment variables:

$env:UAOS_FIXTURE_ROOT_1='D:\\YourFolder'
$env:UAOS_FIXTURE_ROOT_2='E:\\YourExternalDrive'

Then run:
node .\scripts\UAOS_R1_GENERATE_FIXTURE_COLLECTOR.mjs