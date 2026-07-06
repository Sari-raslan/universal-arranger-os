<#
.SYNOPSIS
    UAOS V1705  Virtual New Set Inventory Builder

.DESCRIPTION
    Builds a useful virtual UAOS set from the old backup directory.
    It inventories all files, classifies extensions, creates menus, reports,
    traceability, virtual set structure, package, seal, and tests.
    It does not copy or generate forbidden keyboard package files.
#>

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$oldDir = "C:\Users\ssare\Desktop\KORG_PA3X_RECOVERY_BACKUP_20260619-150450"

$runPath = "$factoryPath\uaos-v1705-virtual-new-set-inventory-builder"
$outputRoot = "$runPath\virtual-set-output"
$programPath = "$runPath\test-programs"
$reportPath = "$runPath\reports"
$sealPath = "$runPath\seal"
$dashboardPath = "$runPath\dashboard"
$packagePath = "$runPath\package"
$logsPath = "$runPath\logs"

$ForbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")

$AllowedCopyExt = @(
    ".txt", ".md", ".json", ".csv", ".html", ".htm", ".js", ".css", ".xml",
    ".mid", ".midi", ".wav", ".mp3", ".png", ".jpg", ".jpeg", ".webp", ".pdf"
)

$AllowedOutputExt = @(
    ".txt", ".md", ".json", ".csv", ".html", ".htm", ".js", ".css", ".xml",
    ".mid", ".midi", ".wav", ".mp3", ".png", ".jpg", ".jpeg", ".webp", ".pdf",
    ".ps1", ".zip"
)

$Safety = [ordered]@{
    writer_ready = $false
    writer_mode = "VIRTUAL_SET_INVENTORY_ONLY"
    real_keyboard_binary_writer = "NO"
    keyboard_package_output_generated = "NO"
    forbidden_keyboard_extensions_generated = "NO"
    forbidden_keyboard_extensions_copied = "NO"
    usb_write = "NO"
    hardware_load = "NO"
    deploy = "NO"
    payment = "NO"
    brand_device_compatibility_claims = "NO"
}

function New-UaosDir {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-UaosText {
    param(
        [string]$Path,
        [string]$Content
    )

    New-UaosDir (Split-Path -Parent $Path)
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

function Write-UaosJson {
    param(
        [string]$Path,
        $Data
    )

    Write-UaosText -Path $Path -Content ($Data | ConvertTo-Json -Depth 60)
}

function HtmlEncode {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode([string]$Text)
}

function Safe-NamePart {
    param([string]$Name)

    $safe = $Name -replace '[\\/:*?"<>|]', "_"
    $safe = $safe.Trim()

    if ([string]::IsNullOrWhiteSpace($safe)) {
        $safe = "unnamed"
    }

    $ext = [System.IO.Path]::GetExtension($safe).ToLowerInvariant()

    if ($ForbiddenExt -contains $ext) {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($safe)
        $tag = $ext.TrimStart(".").ToUpperInvariant()
        $safe = "${base}_${tag}_SOURCE_SECTION"
    }

    return $safe
}

function Get-RelPath {
    param(
        [string]$Root,
        [string]$Full
    )

    $rootFull = [System.IO.Path]::GetFullPath($Root)
    $fullFull = [System.IO.Path]::GetFullPath($Full)

    if ($fullFull.StartsWith($rootFull)) {
        return ($fullFull.Substring($rootFull.Length) -replace '^[\\/]+', '')
    }

    return $Full
}

function Get-TopFolder {
    param([string]$RelativePath)

    $parts = $RelativePath -split '[\\/]'

    if ($parts.Count -gt 1) {
        return $parts[0]
    }

    return "_ROOT"
}

function Test-InForbiddenSourceFolder {
    param([string]$RelativePath)

    $parts = $RelativePath -split '[\\/]'

    if ($parts.Count -le 1) {
        return $false
    }

    for ($i = 0; $i -lt ($parts.Count - 1); $i++) {
        $partExt = [System.IO.Path]::GetExtension($parts[$i]).ToLowerInvariant()

        if ($ForbiddenExt -contains $partExt) {
            return $true
        }
    }

    return $false
}

function Get-Classification {
    param(
        [string]$RelativePath,
        [string]$Extension
    )

    $ext = $Extension.ToLowerInvariant()
    $insideForbiddenFolder = Test-InForbiddenSourceFolder -RelativePath $RelativePath

    if ($ForbiddenExt -contains $ext) {
        return "BLOCKED_FORBIDDEN_FILE_EXTENSION"
    }

    if ($insideForbiddenFolder) {
        return "BLOCKED_INSIDE_FORBIDDEN_SOURCE_FOLDER"
    }

    if ($AllowedCopyExt -contains $ext) {
        return "SAFE_COPY_ALLOWED"
    }

    if ([string]::IsNullOrWhiteSpace($ext)) {
        return "BLOCKED_NO_EXTENSION"
    }

    return "BLOCKED_UNAPPROVED_EXTENSION"
}

function Test-GeneratedOutputSafety {
    param([string]$Target)

    $violations = @()

    if (!(Test-Path $Target)) {
        $violations += "Missing target: $Target"
        return $violations
    }

    Get-ChildItem $Target -Recurse -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $ext = [System.IO.Path]::GetExtension($_.Name).ToLowerInvariant()

        if ($ForbiddenExt -contains $ext) {
            $violations += "Generated directory has forbidden extension: $($_.FullName)"
        }
    }

    Get-ChildItem $Target -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $ext = $_.Extension.ToLowerInvariant()

        if ($ForbiddenExt -contains $ext) {
            $violations += "Generated file has forbidden extension: $($_.FullName)"
        }

        if ($ext -and !($AllowedOutputExt -contains $ext)) {
            $violations += "Generated file has unapproved extension: $($_.FullName)"
        }

        if ($ext -in @(".html", ".htm", ".md", ".txt", ".json", ".csv", ".js", ".css", ".xml", ".ps1")) {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue

            if ($content -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') {
                $violations += "Unsafe writer_ready enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') {
                $violations += "Unsafe keyboard package output enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\busb_write\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "Unsafe USB write enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\bhardware_load\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "Unsafe hardware load enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "Unsafe deploy enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "Unsafe payment enablement: $($_.FullName)"
            }

            if ($content -match '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b') {
                $violations += "Readiness or compatibility claim detected: $($_.FullName)"
            }
        }
    }

    return $violations
}

function Test-ZipSafety {
    param([string]$ZipPath)

    $result = [ordered]@{
        status = "FAIL"
        exists = $false
        size_bytes = 0
        entries = 0
        violations = @()
    }

    if (!(Test-Path $ZipPath)) {
        $result.violations += "ZIP missing."
        return $result
    }

    $item = Get-Item $ZipPath
    $result.exists = $true
    $result.size_bytes = $item.Length

    if ($item.Length -le 0) {
        $result.violations += "ZIP empty."
        return $result
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)

    try {
        foreach ($entry in $zip.Entries) {
            if ([string]::IsNullOrWhiteSpace($entry.FullName)) {
                continue
            }

            $result.entries++

            $parts = $entry.FullName -split '[\\/]'

            foreach ($part in $parts) {
                $partExt = [System.IO.Path]::GetExtension($part).ToLowerInvariant()

                if ($ForbiddenExt -contains $partExt) {
                    $result.violations += "Forbidden extension in ZIP path segment: $($entry.FullName)"
                }
            }

            $entryExt = [System.IO.Path]::GetExtension($entry.FullName).ToLowerInvariant()

            if ($entryExt -eq ".zip") {
                $result.violations += "Nested ZIP blocked: $($entry.FullName)"
            }

            if ($entryExt -and !($AllowedOutputExt -contains $entryExt)) {
                $result.violations += "Unapproved extension inside ZIP: $($entry.FullName)"
            }
        }
    } finally {
        $zip.Dispose()
    }

    if ($result.entries -le 0) {
        $result.violations += "ZIP has no entries."
    }

    $result.status = if (@($result.violations).Count -eq 0) { "PASS" } else { "FAIL" }

    return $result
}

function Commit-Run {
    param([string]$Status)

    if (!(Test-Path "$basePath\.git")) {
        return "NO_GIT_REPO"
    }

    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V1705_VIRTUAL_NEW_SET_INVENTORY_BUILDER.ps1" "uaos-ai-factory/uaos-v1705-virtual-new-set-inventory-builder" | Out-Null

        git diff --cached --quiet

        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V1705 Virtual New Set Inventory Builder [$Status]" | Out-Null

        if ($LASTEXITCODE -ne 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        $hash = (git rev-parse --short HEAD).Trim()
        Pop-Location
        return $hash
    } catch {
        try { Pop-Location } catch {}
        return "GIT_ERROR"
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1705 Virtual New Set Inventory Builder " -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Old source: $oldDir"
Write-Host ""

if (!(Test-Path $oldDir)) {
    throw "Old directory does not exist: $oldDir"
}

if (!(Get-Item $oldDir).PSIsContainer) {
    throw "Old path is not a directory: $oldDir"
}

if (Test-Path $runPath) {
    Remove-Item $runPath -Recurse -Force
}

New-UaosDir $runPath
New-UaosDir $outputRoot
New-UaosDir $programPath
New-UaosDir $reportPath
New-UaosDir $sealPath
New-UaosDir $dashboardPath
New-UaosDir $packagePath
New-UaosDir $logsPath

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sourceName = Safe-NamePart ((Get-Item $oldDir).Name)
$virtualSetName = "UAOS_VIRTUAL_NEW_SET_${sourceName}_$stamp"
$virtualSetPath = Join-Path $outputRoot $virtualSetName

New-UaosDir $virtualSetPath
New-UaosDir "$virtualSetPath\00_MENU"
New-UaosDir "$virtualSetPath\01_SAFE_COPIED_ALLOWED_FILES"
New-UaosDir "$virtualSetPath\02_SOURCE_INVENTORY"
New-UaosDir "$virtualSetPath\03_EXTENSION_SUMMARY"
New-UaosDir "$virtualSetPath\04_VIRTUAL_SET_STRUCTURE"
New-UaosDir "$virtualSetPath\05_REPORTS"
New-UaosDir "$virtualSetPath\06_SAFETY"
New-UaosDir "$virtualSetPath\07_PREVIEW"

Write-UaosText "$logsPath\RUN_START.txt" @"
UAOS V1705 Virtual New Set Inventory Builder started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Old source: $oldDir
Virtual set: $virtualSetPath
"@

$files = @(Get-ChildItem $oldDir -Recurse -File -ErrorAction SilentlyContinue)
$directories = @(Get-ChildItem $oldDir -Recurse -Directory -ErrorAction SilentlyContinue)

$fileRecords = @()
$copiedRecords = @()
$blockedRecords = @()
$copyErrors = @()

foreach ($file in $files) {
    $rel = Get-RelPath -Root $oldDir -Full $file.FullName
    $ext = $file.Extension.ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($ext)) {
        $extKey = "<NO_EXT>"
    } else {
        $extKey = $ext
    }

    $topFolder = Get-TopFolder -RelativePath $rel
    $classification = Get-Classification -RelativePath $rel -Extension $ext

    $record = [pscustomobject][ordered]@{
        source = $file.FullName
        relative = $rel
        file_name = $file.Name
        extension = $extKey
        top_folder = $topFolder
        bytes = $file.Length
        modified_utc = $file.LastWriteTimeUtc.ToString("o")
        classification = $classification
    }

    $fileRecords += $record

    if ($classification -eq "SAFE_COPY_ALLOWED") {
        try {
            $safeRel = ($rel -split '[\\/]' | ForEach-Object { Safe-NamePart $_ }) -join "\"
            $dest = Join-Path "$virtualSetPath\01_SAFE_COPIED_ALLOWED_FILES" $safeRel

            New-UaosDir (Split-Path -Parent $dest)
            Copy-Item $file.FullName $dest -Force

            $copiedRecords += [ordered]@{
                source = $file.FullName
                destination = $dest
                relative = $rel
                extension = $extKey
                bytes = $file.Length
            }
        } catch {
            $copyErrors += [ordered]@{
                source = $file.FullName
                relative = $rel
                error = $_.Exception.Message
            }
        }
    } else {
        $blockedRecords += [ordered]@{
            source = $file.FullName
            relative = $rel
            extension = $extKey
            top_folder = $topFolder
            bytes = $file.Length
            classification = $classification
        }
    }
}

$extSummary = @()

$fileRecords |
    Group-Object extension |
    Sort-Object Count -Descending |
    ForEach-Object {
        $extSummary += [pscustomobject][ordered]@{
            extension = $_.Name
            count = $_.Count
            total_bytes = ($_.Group | Measure-Object bytes -Sum).Sum
            safe_copy_allowed = (@($_.Group | Where-Object { $_.classification -eq "SAFE_COPY_ALLOWED" }).Count)
            blocked = (@($_.Group | Where-Object { $_.classification -ne "SAFE_COPY_ALLOWED" }).Count)
        }
    }

$classSummary = @()

$fileRecords |
    Group-Object classification |
    Sort-Object Count -Descending |
    ForEach-Object {
        $classSummary += [pscustomobject][ordered]@{
            classification = $_.Name
            count = $_.Count
            total_bytes = ($_.Group | Measure-Object bytes -Sum).Sum
        }
    }

$folderSummary = @()

$fileRecords |
    Group-Object top_folder |
    Sort-Object Count -Descending |
    ForEach-Object {
        $folderSummary += [pscustomobject][ordered]@{
            top_folder = $_.Name
            count = $_.Count
            total_bytes = ($_.Group | Measure-Object bytes -Sum).Sum
            safe_copy_allowed = (@($_.Group | Where-Object { $_.classification -eq "SAFE_COPY_ALLOWED" }).Count)
            blocked = (@($_.Group | Where-Object { $_.classification -ne "SAFE_COPY_ALLOWED" }).Count)
        }
    }

$directoryRecords = @()

foreach ($dir in $directories) {
    $rel = Get-RelPath -Root $oldDir -Full $dir.FullName
    $ext = [System.IO.Path]::GetExtension($dir.Name).ToLowerInvariant()

    $directoryRecords += [ordered]@{
        source = $dir.FullName
        relative = $rel
        name = $dir.Name
        extension = if ([string]::IsNullOrWhiteSpace($ext)) { "<NO_EXT>" } else { $ext }
        forbidden_extension_folder = ($ForbiddenExt -contains $ext)
    }
}

Write-UaosJson "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.json" ([ordered]@{
    old_source = $oldDir
    generated_at = Get-Date -Format "o"
    files = $fileRecords
})

Write-UaosJson "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_DIRECTORY_INVENTORY.json" ([ordered]@{
    old_source = $oldDir
    generated_at = Get-Date -Format "o"
    directories = $directoryRecords
})

Write-UaosJson "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_BLOCKED_FILE_INVENTORY.json" ([ordered]@{
    count = @($blockedRecords).Count
    blocked = $blockedRecords
})

Write-UaosJson "$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_EXTENSION_SUMMARY.json" ([ordered]@{
    extensions = $extSummary
    classifications = $classSummary
    folders = $folderSummary
})

$inventoryCsv = "relative,file_name,extension,top_folder,bytes,modified_utc,classification,source`n"

foreach ($r in $fileRecords) {
    $inventoryCsv += '"' + ($r.relative -replace '"','""') + '","' +
        ($r.file_name -replace '"','""') + '","' +
        ($r.extension -replace '"','""') + '","' +
        ($r.top_folder -replace '"','""') + '",' +
        $r.bytes + ',"' +
        ($r.modified_utc -replace '"','""') + '","' +
        ($r.classification -replace '"','""') + '","' +
        ($r.source -replace '"','""') + '"' + "`n"
}

Write-UaosText "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.csv" $inventoryCsv

$extCsv = "extension,count,total_bytes,safe_copy_allowed,blocked`n"

foreach ($e in $extSummary) {
    $extCsv += '"' + ($e.extension -replace '"','""') + '",' +
        $e.count + ',' +
        $e.total_bytes + ',' +
        $e.safe_copy_allowed + ',' +
        $e.blocked + "`n"
}

Write-UaosText "$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_EXTENSION_SUMMARY.csv" $extCsv

$classCsv = "classification,count,total_bytes`n"

foreach ($c in $classSummary) {
    $classCsv += '"' + ($c.classification -replace '"','""') + '",' +
        $c.count + ',' +
        $c.total_bytes + "`n"
}

Write-UaosText "$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_CLASSIFICATION_SUMMARY.csv" $classCsv

$folderCsv = "top_folder,count,total_bytes,safe_copy_allowed,blocked`n"

foreach ($f in $folderSummary) {
    $folderCsv += '"' + ($f.top_folder -replace '"','""') + '",' +
        $f.count + ',' +
        $f.total_bytes + ',' +
        $f.safe_copy_allowed + ',' +
        $f.blocked + "`n"
}

Write-UaosText "$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_FOLDER_SUMMARY.csv" $folderCsv

$virtualSections = @()

foreach ($folder in $folderSummary) {
    $folderName = $folder.top_folder
    $items = @($fileRecords | Where-Object { $_.top_folder -eq $folderName })

    $virtualSections += [pscustomobject][ordered]@{
        section_id = Safe-NamePart $folderName
        source_top_folder = $folderName
        item_count = $items.Count
        total_bytes = ($items | Measure-Object bytes -Sum).Sum
        safe_copy_allowed = (@($items | Where-Object { $_.classification -eq "SAFE_COPY_ALLOWED" }).Count)
        blocked = (@($items | Where-Object { $_.classification -ne "SAFE_COPY_ALLOWED" }).Count)
        extension_counts = @(
            $items |
                Group-Object extension |
                Sort-Object Count -Descending |
                ForEach-Object {
                    [ordered]@{
                        extension = $_.Name
                        count = $_.Count
                    }
                }
        )
    }
}

Write-UaosJson "$virtualSetPath\04_VIRTUAL_SET_STRUCTURE\UAOS_VIRTUAL_SET_STRUCTURE.json" ([ordered]@{
    phase = "V1705"
    mode = "VIRTUAL_SET_INVENTORY_ONLY"
    old_source = $oldDir
    virtual_set_path = $virtualSetPath
    sections = $virtualSections
    safety = $Safety
})

$sectionRows = ""

foreach ($s in $virtualSections) {
    $sectionRows += "<tr><td>$(HtmlEncode $s.section_id)</td><td>$(HtmlEncode $s.source_top_folder)</td><td>$($s.item_count)</td><td>$($s.safe_copy_allowed)</td><td>$($s.blocked)</td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($sectionRows)) {
    $sectionRows = "<tr><td colspan='5'>No sections.</td></tr>"
}

$extRows = ""

foreach ($e in $extSummary) {
    $extRows += "<tr><td>$(HtmlEncode $e.extension)</td><td>$($e.count)</td><td>$($e.safe_copy_allowed)</td><td>$($e.blocked)</td><td>$($e.total_bytes)</td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($extRows)) {
    $extRows = "<tr><td colspan='5'>No extension data.</td></tr>"
}

$classRows = ""

foreach ($c in $classSummary) {
    $classRows += "<tr><td>$(HtmlEncode $c.classification)</td><td>$($c.count)</td><td>$($c.total_bytes)</td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($classRows)) {
    $classRows = "<tr><td colspan='3'>No classification data.</td></tr>"
}

$fileRows = ""

foreach ($r in ($fileRecords | Select-Object -First 1200)) {
    $fileRows += "<tr><td>$(HtmlEncode $r.extension)</td><td>$(HtmlEncode $r.classification)</td><td>$(HtmlEncode $r.relative)</td><td>$($r.bytes)</td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($fileRows)) {
    $fileRows = "<tr><td colspan='4'>No files found.</td></tr>"
}

$copiedRows = ""

foreach ($c in ($copiedRecords | Select-Object -First 500)) {
    $safeRel = Get-RelPath -Root "$virtualSetPath\01_SAFE_COPIED_ALLOWED_FILES" -Full $c.destination
    $href = "../01_SAFE_COPIED_ALLOWED_FILES/" + ($safeRel -replace "\\","/")
    $copiedRows += "<tr><td>$(HtmlEncode $c.extension)</td><td>$(HtmlEncode $c.relative)</td><td><a href='$href'>Open</a></td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($copiedRows)) {
    $copiedRows = "<tr><td colspan='3'>No safe copied files. The source is still fully indexed virtually.</td></tr>"
}

Write-UaosText "$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS Virtual New Set Menu</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#0d1117; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.panel { border:1px solid #334155; border-radius:16px; padding:20px; margin-bottom:20px; background:#161b22; }
.good { color:#22c55e; }
.warn { color:#f59e0b; }
.bad { color:#ef4444; }
table { width:100%; border-collapse:collapse; margin-top:10px; }
td, th { border:1px solid #334155; padding:8px; text-align:left; }
.small { color:#9ca3af; font-size:13px; }
</style>
</head>
<body>
<h1>UAOS Virtual New Set Menu</h1>

<div class="panel">
<h2>Status</h2>
<p><b>Mode:</b> VIRTUAL_SET_INVENTORY_ONLY</p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>Virtual set:</b> $(HtmlEncode $virtualSetPath)</p>
<p><b>Scanned files:</b> $($files.Count)</p>
<p><b>Safe copied files:</b> <span class="good">$(@($copiedRecords).Count)</span></p>
<p><b>Virtual indexed files:</b> <span class="warn">$(@($fileRecords).Count)</span></p>
<p><b>Blocked from copying:</b> <span class="warn">$(@($blockedRecords).Count)</span></p>
<p class="small">Blocked files remain in the old source only. This virtual set does not create forbidden package files.</p>
</div>

<div class="panel">
<h2>Safety</h2>
<ul>
<li>writer_ready: false</li>
<li>writer mode: virtual set inventory only</li>
<li>real keyboard binary writer: NO</li>
<li>keyboard package output generated: NO</li>
<li>forbidden keyboard extensions generated: NO</li>
<li>forbidden keyboard extensions copied: NO</li>
<li>USB write: NO</li>
<li>hardware load: NO</li>
<li>deploy: NO</li>
<li>payment: NO</li>
<li>brand/device compatibility claims: NO</li>
</ul>
</div>

<div class="panel">
<h2>Virtual Sections</h2>
<table>
<tr><th>Section ID</th><th>Source Top Folder</th><th>Items</th><th>Safe Copy</th><th>Blocked</th></tr>
$sectionRows
</table>
</div>

<div class="panel">
<h2>Extension Summary</h2>
<table>
<tr><th>Extension</th><th>Count</th><th>Safe Copy</th><th>Blocked</th><th>Total Bytes</th></tr>
$extRows
</table>
</div>

<div class="panel">
<h2>Classification Summary</h2>
<table>
<tr><th>Classification</th><th>Count</th><th>Total Bytes</th></tr>
$classRows
</table>
</div>

<div class="panel">
<h2>Safe Copied Files</h2>
<table>
<tr><th>Ext</th><th>Original Relative Path</th><th>Open</th></tr>
$copiedRows
</table>
</div>

<div class="panel">
<h2>Source File Inventory Preview</h2>
<table>
<tr><th>Ext</th><th>Classification</th><th>Relative Path</th><th>Bytes</th></tr>
$fileRows
</table>
</div>

<div class="panel">
<h2>Indexes</h2>
<ul>
<li><a href="../02_SOURCE_INVENTORY/UAOS_SOURCE_FILE_INVENTORY.json">Source File Inventory JSON</a></li>
<li><a href="../02_SOURCE_INVENTORY/UAOS_SOURCE_FILE_INVENTORY.csv">Source File Inventory CSV</a></li>
<li><a href="../02_SOURCE_INVENTORY/UAOS_BLOCKED_FILE_INVENTORY.json">Blocked File Inventory JSON</a></li>
<li><a href="../03_EXTENSION_SUMMARY/UAOS_EXTENSION_SUMMARY.json">Extension Summary JSON</a></li>
<li><a href="../03_EXTENSION_SUMMARY/UAOS_EXTENSION_SUMMARY.csv">Extension Summary CSV</a></li>
<li><a href="../03_EXTENSION_SUMMARY/UAOS_FOLDER_SUMMARY.csv">Folder Summary CSV</a></li>
<li><a href="../04_VIRTUAL_SET_STRUCTURE/UAOS_VIRTUAL_SET_STRUCTURE.json">Virtual Set Structure JSON</a></li>
<li><a href="../05_REPORTS/UAOS_V1705_VIRTUAL_SET_REPORT.md">Virtual Set Report</a></li>
<li><a href="../06_SAFETY/UAOS_V1705_SAFETY_EVIDENCE.md">Safety Evidence</a></li>
<li><a href="../07_PREVIEW/UAOS_VIRTUAL_SET_PREVIEW.html">Preview</a></li>
</ul>
</div>
</body>
</html>
"@

Write-UaosText "$virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS Virtual Set Preview</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#111827; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.card { background:#1f2937; border:1px solid #334155; border-radius:14px; padding:18px; margin:12px 0; }
</style>
</head>
<body>
<h1>UAOS Virtual Set Preview</h1>

<div class="card">
<p><b>Virtual set:</b> $(HtmlEncode $virtualSetName)</p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>Scanned files:</b> $($files.Count)</p>
<p><b>Safe copied files:</b> $(@($copiedRecords).Count)</p>
<p><b>Virtual indexed files:</b> $(@($fileRecords).Count)</p>
<p><b>Blocked from copying:</b> $(@($blockedRecords).Count)</p>
<p><a href="../00_MENU/UAOS_VIRTUAL_NEW_SET_MENU.html">Open Virtual Menu</a></p>
</div>

<div class="card">
<p>This preview is metadata-only. It does not create keyboard package files, write USB, load hardware, deploy, or activate payment.</p>
</div>
</body>
</html>
"@

Write-UaosText "$virtualSetPath\06_SAFETY\UAOS_V1705_SAFETY_EVIDENCE.md" @"
# UAOS V1705 Safety Evidence

- writer_ready: false
- writer_mode: VIRTUAL_SET_INVENTORY_ONLY
- real keyboard binary writer: NO
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO

Forbidden file/folder extensions:
- .sty
- .set
- .prs
- .prf
- .kst

Meaning:
The old source is inventoried and classified. Forbidden files are not copied into the generated virtual set.
"@

Write-UaosText "$virtualSetPath\05_REPORTS\UAOS_V1705_VIRTUAL_SET_REPORT.md" @"
# UAOS V1705 Virtual New Set Report

Result: **PENDING_VALIDATION**

Old source:
$oldDir

Virtual set:
$virtualSetPath

Scanned files: $($files.Count)  
Safe copied files: $(@($copiedRecords).Count)  
Virtual indexed files: $(@($fileRecords).Count)  
Blocked from copying: $(@($blockedRecords).Count)  
Copy errors: $(@($copyErrors).Count)

## Why copied files may be zero

A recovery backup can contain only source formats or package-like files that are not safe to copy into a generated UAOS set under the current safety lock. V1705 still creates a useful virtual set menu, extension inventory, classification map, folder map, and reports.

## Safety

- writer_ready: false
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO
"@

$safetyViolations = Test-GeneratedOutputSafety -Target $virtualSetPath
$safetyPass = (@($safetyViolations).Count -eq 0)

$inventoryExists = (
    (Test-Path "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.json") -and
    (Test-Path "$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.csv") -and
    (Test-Path "$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_EXTENSION_SUMMARY.json") -and
    (Test-Path "$virtualSetPath\04_VIRTUAL_SET_STRUCTURE\UAOS_VIRTUAL_SET_STRUCTURE.json")
)

$menuExists = Test-Path "$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html"
$previewExists = Test-Path "$virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html"
$structureExists = Test-Path "$virtualSetPath\04_VIRTUAL_SET_STRUCTURE\UAOS_VIRTUAL_SET_STRUCTURE.json"
$scanPass = ($files.Count -gt 0)
$errorPass = (@($copyErrors).Count -eq 0)

$preStatus = if ($scanPass -and $inventoryExists -and $menuExists -and $previewExists -and $structureExists -and $safetyPass -and $errorPass) {
    "PASS"
} else {
    "FAIL"
}

Write-UaosText "$virtualSetPath\05_REPORTS\UAOS_V1705_VIRTUAL_SET_REPORT.md" @"
# UAOS V1705 Virtual New Set Report

Result: **$preStatus**

Old source:
$oldDir

Virtual set:
$virtualSetPath

Scanned files: $($files.Count)  
Safe copied files: $(@($copiedRecords).Count)  
Virtual indexed files: $(@($fileRecords).Count)  
Blocked from copying: $(@($blockedRecords).Count)  
Copy errors: $(@($copyErrors).Count)  
Safety violations: $(@($safetyViolations).Count)

## Why copied files may be zero

A recovery backup can contain only source formats or package-like files that are not safe to copy into a generated UAOS set under the current safety lock.

V1705 still creates a useful virtual set menu, extension inventory, classification map, folder map, and reports.

## Safety

- writer_ready: false
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO
"@

Write-UaosJson "$reportPath\UAOS_V1705_VIRTUAL_SET_RESULT.json" ([ordered]@{
    status = $preStatus
    old_source = $oldDir
    virtual_set_path = $virtualSetPath
    menu = "$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html"
    preview = "$virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html"
    scanned_files = $files.Count
    safe_copied_files = @($copiedRecords).Count
    virtual_indexed_files = @($fileRecords).Count
    blocked_from_copying = @($blockedRecords).Count
    copy_errors = $copyErrors
    safety_pass = $safetyPass
    safety_violations = $safetyViolations
    extension_summary = $extSummary
    classification_summary = $classSummary
    folder_summary = $folderSummary
    checked_at = Get-Date -Format "o"
})

Write-UaosText "$reportPath\UAOS_V1705_VIRTUAL_SET_RESULT.md" @"
# UAOS V1705 Virtual New Set Result

Status: **$preStatus**

Old source:
$oldDir

Virtual set:
$virtualSetPath

Menu:
$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html

Preview:
$virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html

Scanned files: $($files.Count)  
Safe copied files: $(@($copiedRecords).Count)  
Virtual indexed files: $(@($fileRecords).Count)  
Blocked from copying: $(@($blockedRecords).Count)  
Safety pass: $safetyPass

## Boundary

This is a virtual UAOS set inventory builder.  
It does not create keyboard package files.
"@

Write-UaosText "$sealPath\UAOS_V1705_VIRTUAL_SET_FINAL_SEAL.md" @"
# UAOS V1705 Virtual New Set Final Seal

Result: **$preStatus**

Old source:
$oldDir

Virtual set:
$virtualSetPath

Menu:
$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html

## Safety

- writer_ready: false
- writer_mode: VIRTUAL_SET_INVENTORY_ONLY
- real keyboard binary writer: NO
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO

## Boundary

This seal approves only the generated virtual inventory set above.

It does not approve keyboard package generation, USB writing, hardware loading, deployment, payment, or compatibility claims.
"@

Write-UaosText "$dashboardPath\UAOS_V1705_VIRTUAL_SET_DASHBOARD.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS V1705 Virtual New Set Dashboard</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#0d1117; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.panel { border:1px solid #334155; border-radius:16px; padding:20px; margin-bottom:20px; background:#161b22; }
.good { color:#22c55e; }
.bad { color:#ef4444; }
.warn { color:#f59e0b; }
table { width:100%; border-collapse:collapse; }
td, th { border:1px solid #334155; padding:8px; text-align:left; }
</style>
</head>
<body>
<h1>UAOS V1705 Virtual New Set Dashboard</h1>

<div class="panel">
<h2>Status</h2>
<p><b>Result:</b> <span class="$(if ($preStatus -eq "PASS") { "good" } else { "bad" })">$preStatus</span></p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>Virtual set:</b> $(HtmlEncode $virtualSetPath)</p>
<p><b>Scanned files:</b> $($files.Count)</p>
<p><b>Safe copied files:</b> $(@($copiedRecords).Count)</p>
<p><b>Virtual indexed files:</b> $(@($fileRecords).Count)</p>
<p><b>Blocked from copying:</b> $(@($blockedRecords).Count)</p>
<p><b>Safety pass:</b> $safetyPass</p>
</div>

<div class="panel">
<h2>Open</h2>
<ul>
<li><a href="../virtual-set-output/$virtualSetName/00_MENU/UAOS_VIRTUAL_NEW_SET_MENU.html">Virtual New Set Menu</a></li>
<li><a href="../virtual-set-output/$virtualSetName/07_PREVIEW/UAOS_VIRTUAL_SET_PREVIEW.html">Preview</a></li>
<li><a href="../reports/UAOS_V1705_VIRTUAL_SET_RESULT.md">Result Report</a></li>
<li><a href="../seal/UAOS_V1705_VIRTUAL_SET_FINAL_SEAL.md">Final Seal</a></li>
</ul>
</div>

<div class="panel">
<h2>Top Extensions</h2>
<table>
<tr><th>Extension</th><th>Count</th><th>Safe Copy</th><th>Blocked</th></tr>
$(
    ($extSummary | Select-Object -First 20 | ForEach-Object {
        "<tr><td>$(HtmlEncode $_.extension)</td><td>$($_.count)</td><td>$($_.safe_copy_allowed)</td><td>$($_.blocked)</td></tr>"
    }) -join "`n"
)
</table>
</div>

<div class="panel">
<h2>Safety</h2>
<ul>
<li>writer_ready: false</li>
<li>writer mode: virtual set inventory only</li>
<li>keyboard package output generated: NO</li>
<li>forbidden keyboard extensions generated: NO</li>
<li>forbidden keyboard extensions copied: NO</li>
<li>USB write: NO</li>
<li>hardware load: NO</li>
<li>deploy: NO</li>
<li>payment: NO</li>
<li>brand/device compatibility claims: NO</li>
</ul>
</div>
</body>
</html>
"@

Write-UaosText "$programPath\RUN_VIRTUAL_SET_VALIDATE.ps1" @"
`$ErrorActionPreference = 'Stop'
`$target = '$virtualSetPath'
`$forbidden = @('.sty','.set','.prs','.prf','.kst')
`$bad = @()

if (!(Test-Path `$target)) {
    Write-Host 'VIRTUAL_SET_VALIDATE: FAIL missing target'
    exit 1
}

Get-ChildItem `$target -Recurse -Directory | ForEach-Object {
    if (`$forbidden -contains ([System.IO.Path]::GetExtension(`$_.Name).ToLowerInvariant())) {
        `$bad += "Generated forbidden directory extension: `$(`$_.FullName)"
    }
}

Get-ChildItem `$target -Recurse -File | ForEach-Object {
    if (`$forbidden -contains `$_.Extension.ToLowerInvariant()) {
        `$bad += "Generated forbidden file extension: `$(`$_.FullName)"
    }
}

`$required = @(
    '$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html',
    '$virtualSetPath\02_SOURCE_INVENTORY\UAOS_SOURCE_FILE_INVENTORY.json',
    '$virtualSetPath\03_EXTENSION_SUMMARY\UAOS_EXTENSION_SUMMARY.json',
    '$virtualSetPath\04_VIRTUAL_SET_STRUCTURE\UAOS_VIRTUAL_SET_STRUCTURE.json',
    '$virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html'
)

foreach (`$r in `$required) {
    if (!(Test-Path `$r)) {
        `$bad += "Missing required artifact: `$r"
    }
}

if (`$bad.Count -eq 0) {
    Write-Host 'VIRTUAL_SET_VALIDATE: PASS'
    exit 0
} else {
    `$bad | ForEach-Object { Write-Host `$_ }
    Write-Host 'VIRTUAL_SET_VALIDATE: FAIL'
    exit 1
}
"@

$zipOut = "$packagePath\UAOS_V1705_VIRTUAL_NEW_SET_INVENTORY_PACKAGE.zip"
$packageContents = "$packagePath\contents"

if (Test-Path $zipOut) {
    Remove-Item $zipOut -Force
}

if (Test-Path $packageContents) {
    Remove-Item $packageContents -Recurse -Force
}

New-UaosDir $packageContents

Copy-Item $virtualSetPath "$packageContents\virtual-set" -Recurse -Force
Copy-Item $reportPath "$packageContents\reports" -Recurse -Force
Copy-Item $sealPath "$packageContents\seal" -Recurse -Force
Copy-Item $dashboardPath "$packageContents\dashboard" -Recurse -Force
Copy-Item $programPath "$packageContents\test-programs" -Recurse -Force

Compress-Archive -Path "$packageContents\*" -DestinationPath $zipOut -Force

$zipResult = Test-ZipSafety -ZipPath $zipOut
$packagePass = ($zipResult.status -eq "PASS")

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$programPath\RUN_VIRTUAL_SET_VALIDATE.ps1"
$externalValidatePass = ($LASTEXITCODE -eq 0)

$finalStatus = if ($preStatus -eq "PASS" -and $packagePass -and $externalValidatePass) {
    "PASS"
} else {
    "FAIL"
}

Write-UaosJson "$reportPath\UAOS_V1705_FINAL_AUDIT.json" ([ordered]@{
    status = $finalStatus
    pre_status = $preStatus
    package_pass = $packagePass
    external_validate_pass = $externalValidatePass
    zip_result = $zipResult
    safety_pass = $safetyPass
    safety_violations = $safetyViolations
    old_source = $oldDir
    virtual_set = $virtualSetPath
    package = $zipOut
    checked_at = Get-Date -Format "o"
})

Write-UaosText "$sealPath\UAOS_V1705_VIRTUAL_SET_FINAL_SEAL.md" @"
# UAOS V1705 Virtual New Set Final Seal

Result: **$finalStatus**

Old source:
$oldDir

Virtual set:
$virtualSetPath

Menu:
$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html

Package:
$zipOut

## Safety

- writer_ready: false
- writer_mode: VIRTUAL_SET_INVENTORY_ONLY
- real keyboard binary writer: NO
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO

## Boundary

This seal approves only the generated virtual inventory set above.

It does not approve keyboard package generation, USB writing, hardware loading, deployment, payment, or compatibility claims.
"@

Write-UaosText "$logsPath\RUN_COMPLETE.txt" @"
UAOS V1705 Virtual New Set Inventory Builder complete.
Result: $finalStatus
Old source: $oldDir
Virtual set: $virtualSetPath
Package: $zipOut
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$commitHash = Commit-Run -Status $finalStatus

$color = if ($finalStatus -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1705 Virtual New Set Inventory: $finalStatus " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Old source directory:          $oldDir"
Write-Host "Virtual set:                   $virtualSetPath"
Write-Host "Scanned files:                 $($files.Count)"
Write-Host "Safe copied files:             $(@($copiedRecords).Count)"
Write-Host "Virtual indexed files:         $(@($fileRecords).Count)"
Write-Host "Blocked from copying:          $(@($blockedRecords).Count)"
Write-Host "Safety pass:                   $safetyPass"
Write-Host "Package pass:                  $packagePass"
Write-Host "External validate pass:        $externalValidatePass"
Write-Host "Commit Hash:                   $commitHash"
Write-Host "-----------------------------------------------"
Write-Host "Menu:      $virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html"
Write-Host "Preview:   $virtualSetPath\07_PREVIEW\UAOS_VIRTUAL_SET_PREVIEW.html"
Write-Host "Dashboard: $dashboardPath\UAOS_V1705_VIRTUAL_SET_DASHBOARD.html"
Write-Host "Report:    $reportPath\UAOS_V1705_VIRTUAL_SET_RESULT.md"
Write-Host "Seal:      $sealPath\UAOS_V1705_VIRTUAL_SET_FINAL_SEAL.md"
Write-Host "Package:   $zipOut"
Write-Host "==============================================="
Write-Host ""

Start-Process "$virtualSetPath\00_MENU\UAOS_VIRTUAL_NEW_SET_MENU.html"

if ($finalStatus -ne "PASS") {
    exit 1
}

