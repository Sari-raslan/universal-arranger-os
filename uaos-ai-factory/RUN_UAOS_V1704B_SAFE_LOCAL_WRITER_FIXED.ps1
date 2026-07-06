$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$oldDir = "C:\Users\ssare\Desktop\KORG_PA3X_RECOVERY_BACKUP_20260619-150450"

$runPath = "$factoryPath\uaos-v1704-safe-local-writer-new-set-builder"
$outputRoot = "$runPath\writer-output"
$programPath = "$runPath\writer-programs"
$reportPath = "$runPath\reports"
$sealPath = "$runPath\seal"
$logPath = "$runPath\logs"
$dashboardPath = "$runPath\dashboard"

$ForbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")

$AllowedCopyExt = @(
    ".txt", ".md", ".json", ".csv", ".html", ".htm", ".js", ".css", ".xml",
    ".mid", ".midi", ".wav", ".mp3", ".png", ".jpg", ".jpeg", ".webp", ".pdf"
)

$AllowedPackageExt = @(
    ".txt", ".md", ".json", ".csv", ".html", ".htm", ".js", ".css", ".xml",
    ".mid", ".midi", ".wav", ".mp3", ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".ps1"
)

$TextLikeExt = @(".txt", ".md", ".json", ".csv", ".html", ".htm", ".js", ".css", ".xml")

$Safety = [ordered]@{
    writer_ready = $false
    writer_mode = "SAFE_LOCAL_FILE_WRITER_ONLY"
    real_keyboard_binary_writer = "NO"
    keyboard_package_output_generated = "NO"
    forbidden_keyboard_extensions_generated = "NO"
    usb_write = "NO"
    hardware_load = "NO"
    deploy = "NO"
    payment = "NO"
    brand_device_compatibility_claims = "NO"
}

$UnsafePatterns = @(
    @{ id = "writer_ready_true"; pattern = '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b' },
    @{ id = "keyboard_package_true"; pattern = '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b' },
    @{ id = "usb_write_enabled"; pattern = '(?i)\busb_write\b\s*[:=]\s*(true|yes|enabled|active)\b' },
    @{ id = "hardware_load_enabled"; pattern = '(?i)\bhardware_load\b\s*[:=]\s*(true|yes|enabled|active)\b' },
    @{ id = "deploy_enabled"; pattern = '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b' },
    @{ id = "payment_enabled"; pattern = '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b' },
    @{ id = "ready_claim"; pattern = '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b' }
)

function New-D {
    param([string]$Path)
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function W {
    param([string]$Path, [string]$Content)
    New-D (Split-Path -Parent $Path)
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

function J {
    param([string]$Path, $Data)
    W $Path ($Data | ConvertTo-Json -Depth 80)
}

function HtmlEncode {
    param([string]$Text)
    if ($null -eq $Text) { return "" }
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
        $safe = "${base}_${tag}_BLOCKED_DIR"
    }

    return $safe
}

function RelPath {
    param([string]$Root, [string]$Full)

    $rootFull = [System.IO.Path]::GetFullPath($Root)
    $fullFull = [System.IO.Path]::GetFullPath($Full)

    if ($fullFull.StartsWith($rootFull)) {
        return ($fullFull.Substring($rootFull.Length) -replace '^[\\/]+', '')
    }

    return $Full
}

function Has-UnsafeText {
    param([string]$Path)

    try {
        $content = Get-Content $Path -Raw -ErrorAction Stop
        foreach ($rule in $UnsafePatterns) {
            if ($content -match $rule.pattern) {
                return $rule.id
            }
        }
    } catch {
        return "read_error"
    }

    return $null
}

function Test-OutputSafety {
    param([string]$Target)

    $bad = @()

    if (!(Test-Path $Target)) {
        $bad += "Missing target: $Target"
        return $bad
    }

    Get-ChildItem $Target -Recurse -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $ext = [System.IO.Path]::GetExtension($_.Name).ToLowerInvariant()
        if ($ForbiddenExt -contains $ext) {
            $bad += "Forbidden directory extension detected: $($_.FullName)"
        }
    }

    Get-ChildItem $Target -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $ext = $_.Extension.ToLowerInvariant()

        if ($ForbiddenExt -contains $ext) {
            $bad += "Forbidden file extension detected: $($_.FullName)"
        }

        if ($ext -in @(".html", ".htm", ".md", ".txt", ".json", ".csv", ".js", ".css", ".xml", ".ps1")) {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue

            foreach ($rule in $UnsafePatterns) {
                if ($content -match $rule.pattern) {
                    $bad += "Unsafe content $($rule.id): $($_.FullName)"
                }
            }
        }
    }

    return $bad
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

            if ($entryExt -and !($AllowedPackageExt -contains $entryExt)) {
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

        git add -- "uaos-ai-factory/RUN_UAOS_V1704B_SAFE_LOCAL_WRITER_FIXED.ps1" "uaos-ai-factory/uaos-v1704-safe-local-writer-new-set-builder" | Out-Null

        git diff --cached --quiet

        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V1704B Safe Local Writer Fixed [$Status]" | Out-Null

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
Write-Host " UAOS V1704B Safe Local Writer Fixed " -ForegroundColor White -BackgroundColor DarkBlue
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

New-D $runPath
New-D $outputRoot
New-D $programPath
New-D $reportPath
New-D $sealPath
New-D $logPath
New-D $dashboardPath

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sourceName = Safe-NamePart ((Get-Item $oldDir).Name)
$newSetName = "UAOS_NEW_LOCAL_SET_${sourceName}_$stamp"
$newSetPath = Join-Path $outputRoot $newSetName

New-D $newSetPath
New-D "$newSetPath\00_MENU"
New-D "$newSetPath\01_COPIED_ALLOWED_FILES"
New-D "$newSetPath\02_BLOCKED_FILES_INDEX"
New-D "$newSetPath\03_MANIFEST"
New-D "$newSetPath\04_REPORTS"
New-D "$newSetPath\05_SAFETY"
New-D "$newSetPath\06_PREVIEW"

W "$logPath\RUN_START.txt" @"
UAOS V1704B Safe Local Writer started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Old source: $oldDir
New local set: $newSetPath
"@

$files = @(Get-ChildItem $oldDir -Recurse -File -ErrorAction SilentlyContinue)
$copied = @()
$blocked = @()
$errors = @()

foreach ($file in $files) {
    $rel = RelPath $oldDir $file.FullName
    $ext = $file.Extension.ToLowerInvariant()

    if ($ForbiddenExt -contains $ext) {
        $blocked += [ordered]@{
            source = $file.FullName
            relative = $rel
            extension = $ext
            reason = "Forbidden keyboard/package extension blocked."
        }
        continue
    }

    if (!($AllowedCopyExt -contains $ext)) {
        $blocked += [ordered]@{
            source = $file.FullName
            relative = $rel
            extension = $ext
            reason = "Extension not in safe local writer allowlist."
        }
        continue
    }

    if ($TextLikeExt -contains $ext) {
        $unsafe = Has-UnsafeText $file.FullName

        if ($null -ne $unsafe) {
            $blocked += [ordered]@{
                source = $file.FullName
                relative = $rel
                extension = $ext
                reason = "Text-like file blocked due unsafe pattern or read issue: $unsafe"
            }
            continue
        }
    }

    try {
        $safeRel = ($rel -split '[\\/]' | ForEach-Object { Safe-NamePart $_ }) -join "\"
        $dest = Join-Path "$newSetPath\01_COPIED_ALLOWED_FILES" $safeRel

        New-D (Split-Path -Parent $dest)
        Copy-Item $file.FullName $dest -Force

        $copied += [ordered]@{
            source = $file.FullName
            destination = $dest
            relative = $rel
            extension = $ext
            bytes = $file.Length
        }
    } catch {
        $errors += [ordered]@{
            source = $file.FullName
            relative = $rel
            error = $_.Exception.Message
        }
    }
}

$summary = [ordered]@{
    phase = "V1704B"
    mode = "SAFE_LOCAL_FILE_WRITER_ONLY"
    old_source_directory = $oldDir
    new_local_set_path = $newSetPath
    scanned_files = $files.Count
    copied_files = @($copied).Count
    blocked_files = @($blocked).Count
    error_count = @($errors).Count
    safety = $Safety
    created_at = Get-Date -Format "o"
}

J "$newSetPath\03_MANIFEST\UAOS_NEW_LOCAL_SET_MANIFEST.json" ([ordered]@{
    summary = $summary
    copied = $copied
    blocked = $blocked
    errors = $errors
})

J "$newSetPath\02_BLOCKED_FILES_INDEX\UAOS_BLOCKED_FILES_INDEX.json" ([ordered]@{
    blocked = $blocked
    count = @($blocked).Count
})

$copiedCsv = "source,destination,relative,extension,bytes`n"

foreach ($c in $copied) {
    $copiedCsv += '"' + ($c.source -replace '"','""') + '","' + ($c.destination -replace '"','""') + '","' + ($c.relative -replace '"','""') + '","' + $c.extension + '",' + $c.bytes + "`n"
}

W "$newSetPath\03_MANIFEST\UAOS_COPIED_FILES.csv" $copiedCsv

$blockedCsv = "source,relative,extension,reason`n"

foreach ($b in $blocked) {
    $blockedCsv += '"' + ($b.source -replace '"','""') + '","' + ($b.relative -replace '"','""') + '","' + $b.extension + '","' + ($b.reason -replace '"','""') + '"' + "`n"
}

W "$newSetPath\02_BLOCKED_FILES_INDEX\UAOS_BLOCKED_FILES.csv" $blockedCsv

$menuRows = ""

foreach ($c in ($copied | Select-Object -First 1000)) {
    $safeRel = RelPath "$newSetPath\01_COPIED_ALLOWED_FILES" $c.destination
    $href = "../01_COPIED_ALLOWED_FILES/" + ($safeRel -replace "\\","/")
    $menuRows += "<tr><td>$(HtmlEncode $c.extension)</td><td>$(HtmlEncode $c.relative)</td><td><a href='$href'>Open</a></td></tr>`n"
}

if ([string]::IsNullOrWhiteSpace($menuRows)) {
    $menuRows = "<tr><td colspan='3'>No copied files available.</td></tr>"
}

W "$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS New Local Set Menu</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#0d1117; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.panel { border:1px solid #334155; border-radius:16px; padding:20px; margin-bottom:20px; background:#161b22; }
.good { color:#22c55e; }
.warn { color:#f59e0b; }
.bad { color:#ef4444; }
table { width:100%; border-collapse:collapse; }
td, th { border:1px solid #334155; padding:8px; }
</style>
</head>
<body>
<h1>UAOS New Local Set Menu</h1>

<div class="panel">
<h2>Status</h2>
<p><b>Mode:</b> SAFE_LOCAL_FILE_WRITER_ONLY</p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>New local set:</b> $(HtmlEncode $newSetPath)</p>
<p><b>Scanned files:</b> $($files.Count)</p>
<p><b>Copied files:</b> <span class="good">$(@($copied).Count)</span></p>
<p><b>Blocked files:</b> <span class="warn">$(@($blocked).Count)</span></p>
<p><b>Errors:</b> <span class="bad">$(@($errors).Count)</span></p>
</div>

<div class="panel">
<h2>Safety</h2>
<ul>
<li>writer_ready: false</li>
<li>writer mode: safe local file writer only</li>
<li>keyboard package output generated: NO</li>
<li>forbidden keyboard extensions generated: NO</li>
<li>USB write: NO</li>
<li>hardware load: NO</li>
<li>deploy: NO</li>
<li>payment: NO</li>
<li>brand/device compatibility claims: NO</li>
</ul>
</div>

<div class="panel">
<h2>Copied Allowed Files</h2>
<table>
<tr><th>Ext</th><th>Original Relative Path</th><th>Open</th></tr>
$menuRows
</table>
</div>

<div class="panel">
<h2>Indexes</h2>
<ul>
<li><a href="../03_MANIFEST/UAOS_NEW_LOCAL_SET_MANIFEST.json">Manifest JSON</a></li>
<li><a href="../03_MANIFEST/UAOS_COPIED_FILES.csv">Copied Files CSV</a></li>
<li><a href="../02_BLOCKED_FILES_INDEX/UAOS_BLOCKED_FILES.csv">Blocked Files CSV</a></li>
<li><a href="../04_REPORTS/UAOS_SAFE_LOCAL_WRITER_REPORT.md">Writer Report</a></li>
<li><a href="../05_SAFETY/UAOS_SAFE_LOCAL_WRITER_SAFETY.md">Safety Evidence</a></li>
<li><a href="../06_PREVIEW/UAOS_LOCAL_SET_PREVIEW.html">Preview</a></li>
</ul>
</div>
</body>
</html>
"@

W "$newSetPath\05_SAFETY\UAOS_SAFE_LOCAL_WRITER_SAFETY.md" @"
# UAOS Safe Local Writer Safety Evidence

- writer_ready: false
- writer_mode: SAFE_LOCAL_FILE_WRITER_ONLY
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
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
"@

W "$newSetPath\06_PREVIEW\UAOS_LOCAL_SET_PREVIEW.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS Local Set Preview</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#111827; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.card { background:#1f2937; border:1px solid #334155; border-radius:14px; padding:18px; margin:12px 0; }
</style>
</head>
<body>
<h1>UAOS Local Set Preview</h1>

<div class="card">
<p><b>New local set:</b> $(HtmlEncode $newSetName)</p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>Copied files:</b> $(@($copied).Count)</p>
<p><b>Blocked files:</b> $(@($blocked).Count)</p>
<p><a href="../00_MENU/UAOS_NEW_LOCAL_SET_MENU.html">Open Menu</a></p>
</div>
</body>
</html>
"@

$safetyViolations = Test-OutputSafety $newSetPath
$safetyPass = (@($safetyViolations).Count -eq 0)
$writerPass = ($safetyPass -and @($errors).Count -eq 0 -and (Test-Path "$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html"))

$preStatus = if ($writerPass) { "PASS" } else { "FAIL" }

W "$newSetPath\04_REPORTS\UAOS_SAFE_LOCAL_WRITER_REPORT.md" @"
# UAOS V1704B Safe Local Writer Report

Result: **$preStatus**

Old source:
$oldDir

New local set:
$newSetPath

Scanned files: $($files.Count)  
Copied files: $(@($copied).Count)  
Blocked files: $(@($blocked).Count)  
Errors: $(@($errors).Count)  
Safety violations: $(@($safetyViolations).Count)

## Meaning

This writer created a real new local UAOS set folder from the old directory.

It copied allowed evidence, demo, media, and data files into a new isolated local set.

It blocked forbidden keyboard package extensions and unapproved extensions.

## Safety

- writer_ready: false
- writer mode: SAFE_LOCAL_FILE_WRITER_ONLY
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO
"@

J "$reportPath\UAOS_V1704B_SAFE_LOCAL_WRITER_RESULT.json" ([ordered]@{
    status = $preStatus
    summary = $summary
    new_local_set_path = $newSetPath
    menu = "$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html"
    preview = "$newSetPath\06_PREVIEW\UAOS_LOCAL_SET_PREVIEW.html"
    safety_pass = $safetyPass
    safety_violations = $safetyViolations
    copied_count = @($copied).Count
    blocked_count = @($blocked).Count
    errors = $errors
})

W "$reportPath\UAOS_V1704B_SAFE_LOCAL_WRITER_RESULT.md" @"
# UAOS V1704B Safe Local Writer Result

Status: **$preStatus**

Old source:
$oldDir

New local set:
$newSetPath

Menu:
$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html

Preview:
$newSetPath\06_PREVIEW\UAOS_LOCAL_SET_PREVIEW.html

Copied files: $(@($copied).Count)  
Blocked files: $(@($blocked).Count)  
Errors: $(@($errors).Count)  
Safety pass: $safetyPass

## Boundary

This is a real local file and folder writer.  
It is not a keyboard binary package writer.
"@

W "$sealPath\UAOS_V1704B_SAFE_LOCAL_WRITER_FINAL_SEAL.md" @"
# UAOS V1704B Safe Local Writer Final Seal

Result: **$preStatus**

Old source:
$oldDir

New local set:
$newSetPath

Menu:
$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html

## Safety

- writer_ready: false
- writer_mode: SAFE_LOCAL_FILE_WRITER_ONLY
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO

## Boundary

This seal approves only the local UAOS folder writer output above.

It does not approve keyboard package generation, USB writing, hardware loading, deployment, payment, or compatibility claims.
"@

W "$dashboardPath\UAOS_V1704B_SAFE_LOCAL_WRITER_DASHBOARD.html" @"
<html>
<head>
<meta charset="utf-8">
<title>UAOS V1704B Safe Local Writer Dashboard</title>
<style>
body { font-family: Segoe UI, Arial, sans-serif; background:#0d1117; color:#f3f4f6; padding:30px; }
a { color:#38bdf8; }
.panel { border:1px solid #334155; border-radius:16px; padding:20px; margin-bottom:20px; background:#161b22; }
.good { color:#22c55e; }
.bad { color:#ef4444; }
.warn { color:#f59e0b; }
</style>
</head>
<body>
<h1>UAOS V1704B Safe Local Writer Dashboard</h1>

<div class="panel">
<h2>Status</h2>
<p><b>Result:</b> <span class="$(if ($preStatus -eq "PASS") { "good" } else { "bad" })">$preStatus</span></p>
<p><b>Old source:</b> $(HtmlEncode $oldDir)</p>
<p><b>New local set:</b> $(HtmlEncode $newSetPath)</p>
<p><b>Scanned files:</b> $($files.Count)</p>
<p><b>Copied files:</b> $(@($copied).Count)</p>
<p><b>Blocked files:</b> $(@($blocked).Count)</p>
<p><b>Safety pass:</b> $safetyPass</p>
</div>

<div class="panel">
<h2>Open</h2>
<ul>
<li><a href="../writer-output/$newSetName/00_MENU/UAOS_NEW_LOCAL_SET_MENU.html">New Set Menu</a></li>
<li><a href="../writer-output/$newSetName/06_PREVIEW/UAOS_LOCAL_SET_PREVIEW.html">Preview</a></li>
<li><a href="../reports/UAOS_V1704B_SAFE_LOCAL_WRITER_RESULT.md">Writer Result Report</a></li>
<li><a href="../seal/UAOS_V1704B_SAFE_LOCAL_WRITER_FINAL_SEAL.md">Final Seal</a></li>
</ul>
</div>

<div class="panel">
<h2>Safety</h2>
<ul>
<li>writer_ready: false</li>
<li>writer mode: safe local file writer only</li>
<li>keyboard package output generated: NO</li>
<li>forbidden keyboard extensions generated: NO</li>
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

W "$programPath\RUN_SAFE_LOCAL_WRITER_VALIDATE.ps1" @"
`$ErrorActionPreference = 'Stop'
`$target = '$newSetPath'
`$forbidden = @('.sty','.set','.prs','.prf','.kst')
`$bad = @()

if (!(Test-Path `$target)) {
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: FAIL missing target'
    exit 1
}

Get-ChildItem `$target -Recurse -Directory | ForEach-Object {
    if (`$forbidden -contains ([System.IO.Path]::GetExtension(`$_.Name).ToLowerInvariant())) {
        `$bad += "Forbidden directory extension: `$(`$_.FullName)"
    }
}

Get-ChildItem `$target -Recurse -File | ForEach-Object {
    if (`$forbidden -contains `$_.Extension.ToLowerInvariant()) {
        `$bad += "Forbidden file extension: `$(`$_.FullName)"
    }
}

if (`$bad.Count -eq 0) {
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: PASS'
    exit 0
} else {
    `$bad | ForEach-Object { Write-Host `$_ }
    Write-Host 'SAFE_LOCAL_WRITER_VALIDATE: FAIL'
    exit 1
}
"@

$zipOut = "$runPath\UAOS_V1704B_SAFE_LOCAL_WRITER_PACKAGE.zip"

if (Test-Path $zipOut) {
    Remove-Item $zipOut -Force
}

Compress-Archive -Path "$newSetPath", "$reportPath", "$sealPath", "$dashboardPath", "$programPath" -DestinationPath $zipOut -Force

$zipResult = Test-ZipSafety $zipOut
$packagePass = ($zipResult.status -eq "PASS")

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$programPath\RUN_SAFE_LOCAL_WRITER_VALIDATE.ps1"
$externalValidatePass = ($LASTEXITCODE -eq 0)

$finalStatus = if ($writerPass -and $packagePass -and $externalValidatePass) { "PASS" } else { "FAIL" }

J "$reportPath\UAOS_V1704B_SAFE_LOCAL_WRITER_FINAL_AUDIT.json" ([ordered]@{
    status = $finalStatus
    writer_pass = $writerPass
    package_pass = $packagePass
    external_validate_pass = $externalValidatePass
    zip_result = $zipResult
    safety_pass = $safetyPass
    safety_violations = $safetyViolations
    old_source = $oldDir
    new_local_set = $newSetPath
    package = $zipOut
    checked_at = Get-Date -Format "o"
})

W "$sealPath\UAOS_V1704B_SAFE_LOCAL_WRITER_FINAL_SEAL.md" @"
# UAOS V1704B Safe Local Writer Final Seal

Result: **$finalStatus**

Old source:
$oldDir

New local set:
$newSetPath

Menu:
$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html

Package:
$zipOut

## Safety

- writer_ready: false
- writer_mode: SAFE_LOCAL_FILE_WRITER_ONLY
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- brand/device compatibility claims: NO

## Boundary

This seal approves only the local UAOS folder writer output above.

It does not approve keyboard package generation, USB writing, hardware loading, deployment, payment, or compatibility claims.
"@

W "$logPath\RUN_COMPLETE.txt" @"
UAOS V1704B Safe Local Writer complete.
Result: $finalStatus
Old source: $oldDir
New local set: $newSetPath
Package: $zipOut
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$commitHash = Commit-Run $finalStatus

$color = if ($finalStatus -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1704B Safe Local Writer: $finalStatus " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Old source directory:          $oldDir"
Write-Host "New local set:                 $newSetPath"
Write-Host "Scanned files:                 $($files.Count)"
Write-Host "Copied allowed files:          $(@($copied).Count)"
Write-Host "Blocked files:                 $(@($blocked).Count)"
Write-Host "Errors:                        $(@($errors).Count)"
Write-Host "Safety pass:                   $safetyPass"
Write-Host "Package pass:                  $packagePass"
Write-Host "External validate pass:        $externalValidatePass"
Write-Host "Commit Hash:                   $commitHash"
Write-Host "-----------------------------------------------"
Write-Host "Menu:      $newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html"
Write-Host "Preview:   $newSetPath\06_PREVIEW\UAOS_LOCAL_SET_PREVIEW.html"
Write-Host "Dashboard: $dashboardPath\UAOS_V1704B_SAFE_LOCAL_WRITER_DASHBOARD.html"
Write-Host "Report:    $reportPath\UAOS_V1704B_SAFE_LOCAL_WRITER_RESULT.md"
Write-Host "Seal:      $sealPath\UAOS_V1704B_SAFE_LOCAL_WRITER_FINAL_SEAL.md"
Write-Host "Package:   $zipOut"
Write-Host "==============================================="
Write-Host ""

Start-Process "$newSetPath\00_MENU\UAOS_NEW_LOCAL_SET_MENU.html"

if ($finalStatus -ne "PASS") {
    exit 1
}

