$ErrorActionPreference = 'Stop'
$target = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1704-safe-local-writer-new-set-builder\writer-output\UAOS_NEW_LOCAL_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_174211'
$forbidden = @('.sty','.set','.prs','.prf','.kst')
$bad = @()

if (!(Test-Path $target)) {
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: FAIL missing target'
    exit 1
}

Get-ChildItem $target -Recurse -Directory | ForEach-Object {
    if ($forbidden -contains ([System.IO.Path]::GetExtension($_.Name).ToLowerInvariant())) {
        $bad += "Forbidden directory extension: $($_.FullName)"
    }
}

Get-ChildItem $target -Recurse -File | ForEach-Object {
    if ($forbidden -contains $_.Extension.ToLowerInvariant()) {
        $bad += "Forbidden file extension: $($_.FullName)"
    }
}

if ($bad.Count -eq 0) {
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: PASS'
    exit 0
} else {
    $bad | ForEach-Object { Write-Host $_ }
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: FAIL'
    exit 1
}
