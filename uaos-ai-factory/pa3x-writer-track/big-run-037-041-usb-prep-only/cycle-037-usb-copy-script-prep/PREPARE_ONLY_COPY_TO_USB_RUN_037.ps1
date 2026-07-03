param(
  [Parameter(Mandatory = $true)]
  [string]$UsbRoot,

  [Parameter(Mandatory = $true)]
  [string]$OwnerApprovalToken
)

$ErrorActionPreference = 'Stop'

$ExpectedToken = 'RUN_037_OWNER_APPROVED_EMPTY_USB_COPY'
$SourceRoot = 'E:\keyboard-manager-clean\uaos-ai-factory\pa3x-writer-track\run-035-isolated-usb-package-folder-only\USB_REVIEW_ONLY_DO_NOT_COPY_TO_USB'
$SetFolderName = 'UAOS_PA3X_TEST_UNVERIFIED_035.SET'
$CandidateRelativePath = Join-Path $SetFolderName 'PERFORM\UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF'
$CandidatePath = Join-Path $SourceRoot $CandidateRelativePath
$DestinationSetFolder = Join-Path $UsbRoot $SetFolderName

Write-Host 'Run 037 prepared copy script.'
Write-Host 'This script must not be run unless Run 037 is separately approved by the owner.'

if ($OwnerApprovalToken -ne $ExpectedToken) {
  throw 'Owner approval token mismatch. No copy performed.'
}

if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw 'Source review folder is missing. No copy performed.'
}

if (-not (Test-Path -LiteralPath $CandidatePath -PathType Leaf)) {
  throw 'Expected TEST_UNVERIFIED candidate is missing. No copy performed.'
}

if (-not (Test-Path -LiteralPath $UsbRoot -PathType Container)) {
  throw 'USB root does not exist or is not a folder. No copy performed.'
}

$existingItems = Get-ChildItem -LiteralPath $UsbRoot -Force
if ($existingItems.Count -ne 0) {
  throw 'USB root is not empty. No copy performed.'
}

if (Test-Path -LiteralPath $DestinationSetFolder) {
  throw 'Destination SET folder already exists. No overwrite performed.'
}

Copy-Item -LiteralPath (Join-Path $SourceRoot $SetFolderName) -Destination $UsbRoot -Recurse -ErrorAction Stop

Write-Host 'Copy completed only after explicit Run 037 approval token and empty USB validation.'
Write-Host 'No PA3X load, keyboard transfer, overwrite, or internal memory action is performed by this script.'
