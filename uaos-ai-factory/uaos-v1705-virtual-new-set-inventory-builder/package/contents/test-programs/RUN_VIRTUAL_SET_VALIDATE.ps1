$ErrorActionPreference = 'Stop'
$target = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513'
$forbidden = @('.sty','.set','.prs','.prf','.kst')
$bad = @()

if (!(Test-Path $target)) {
    Write-Host 'VIRTUAL_SET_VALIDATE: FAIL missing target'
    exit 1
}

Get-ChildItem $target -Recurse -Directory | ForEach-Object {
    if ($forbidden -contains ([System.IO.Path]::GetExtension($_.Name).ToLowerInvariant())) {
        $bad += "Generated forbidden directory extension: $($_.FullName)"
    }
}

Get-ChildItem $target -Recurse -File | ForEach-Object {
    if ($forbidden -contains $_.Extension.ToLowerInvariant()) {
        $bad += "Generated forbidden file extension: $($_.FullName)"
    }
}

$required = @(
    'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html',
    'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.json',
    'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513\03_EXTENSION_SUMMARY\UAOS_EXTENSION_SUMMARY.json',
    'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513\04_VIRTUAL_SET_STRUCTURE\UAOS_VIRTUAL_SET_STRUCTURE.json',
    'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1705-virtual-new-set-inventory-builder\virtual-set-output\UAOS_VIRTUAL_NEW_SET_KORG_PA3X_RECOVERY_BACKUP_20260619-150450_20260706_180513\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html'
)

foreach ($r in $required) {
    if (!(Test-Path $r)) {
        $bad += "Missing required artifact: $r"
    }
}

if ($bad.Count -eq 0) {
    Write-Host 'VIRTUAL_SET_VALIDATE: PASS'
    exit 0
} else {
    $bad | ForEach-Object { Write-Host $_ }
    Write-Host 'VIRTUAL_SET_VALIDATE: FAIL'
    exit 1
}
