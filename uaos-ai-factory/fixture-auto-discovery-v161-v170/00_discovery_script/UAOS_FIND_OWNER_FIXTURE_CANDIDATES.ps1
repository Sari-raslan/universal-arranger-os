param(
    [string]$RunRoot = "E:\keyboard-manager-clean\uaos-ai-factory\fixture-auto-discovery-v161-v170"
)

$ErrorActionPreference = "Continue"

$resultDir = Join-Path $RunRoot "01_discovery_results"
New-Item -ItemType Directory -Path $resultDir -Force | Out-Null

$searchRoots = @(
    "E:\keyboard-manager-clean",
    "E:\UAOS_FULL_BACKUP_NEW_20260626_215910",
    "E:\UAOS_FULL_BACKUP_NEW_20260626_215910\keyboard-manager-clean_FULL",
    "E:\",
    "C:\Users\ssare\Documents",
    "C:\Users\ssare\Downloads",
    "C:\Users\ssare\Desktop",
    "C:\Users\ssare\OneDrive"
)

$targetExtensions = @(".STY", ".SET", ".PRS", ".PRF", ".KST", ".PCG", ".PAD", ".SBD", ".KMP", ".KSF")
$extensionPriority = @{
    ".STY" = 1
    ".SET" = 2
    ".PRS" = 3
    ".PRF" = 4
    ".KST" = 5
    ".PCG" = 6
    ".PAD" = 7
    ".SBD" = 8
    ".KMP" = 9
    ".KSF" = 10
}

function Get-RootPriority([string]$Path) {
    if ($Path -like "E:\keyboard-manager-clean*") { return 1 }
    if ($Path -like "E:\UAOS_FULL_BACKUP_NEW_20260626_215910*") { return 2 }
    if ($Path -like "C:\Users\ssare\Documents*") { return 3 }
    if ($Path -like "C:\Users\ssare\Downloads*") { return 4 }
    if ($Path -like "C:\Users\ssare\Desktop*") { return 5 }
    if ($Path -like "C:\Users\ssare\OneDrive*") { return 6 }
    return 7
}

function Get-SizeScore([long]$Length) {
    if ($Length -ge 1024 -and $Length -le 268435456) { return 1 }
    if ($Length -gt 0) { return 2 }
    return 3
}

$existingRoots = @()
foreach ($root in $searchRoots) {
    if (Test-Path -LiteralPath $root) {
        $existingRoots += (Resolve-Path -LiteralPath $root).Path
    }
}

$existingRoots = $existingRoots | Sort-Object -Unique
$candidatesByPath = [ordered]@{}
$errors = New-Object System.Collections.Generic.List[object]

$rg = Get-Command rg -ErrorAction SilentlyContinue
if ($rg) {
    $globArgs = @(
        "--files",
        "--hidden",
        "--glob", "*.STY",
        "--glob", "*.SET",
        "--glob", "*.PRS",
        "--glob", "*.PRF",
        "--glob", "*.KST",
        "--glob", "*.PCG",
        "--glob", "*.PAD",
        "--glob", "*.SBD",
        "--glob", "*.KMP",
        "--glob", "*.KSF",
        "--glob", "!**/.git/**",
        "--glob", "!**/node_modules/**",
        "--glob", "!**/dist/**",
        "--glob", "!**/build/**",
        "--glob", "!**/.next/**",
        "--glob", "!**/.vercel/**",
        "--glob", "!**/.electron-builder-cache/**",
        "--glob", "!**/.npm-cache/**"
    )
    foreach ($root in $existingRoots) {
        try {
            $paths = & $rg.Source @globArgs $root 2>&1
            foreach ($line in $paths) {
                $raw = [string]$line
                if ($raw -match "^(?i)(rg:|error:)") {
                    $errors.Add([ordered]@{
                        root = $root
                        message = $raw
                        category = "rg_metadata_search"
                    })
                    continue
                }
                if ([string]::IsNullOrWhiteSpace($raw)) { continue }
                $resolved = $raw
                if (-not [System.IO.Path]::IsPathRooted($resolved)) {
                    $resolved = Join-Path $root $raw
                }
                try {
                    $item = Get-Item -LiteralPath $resolved -ErrorAction Stop
                    $fullPath = $item.FullName
                    if (-not $candidatesByPath.Contains($fullPath)) {
                        $ext = $item.Extension.ToUpperInvariant()
                        if (-not ($targetExtensions -contains $ext)) { continue }
                        $rootPriority = Get-RootPriority $fullPath
                        $extPriority = $extensionPriority[$ext]
                        $sizeScore = Get-SizeScore $item.Length
                        $candidatesByPath[$fullPath] = [ordered]@{
                            path = $fullPath
                            basename = $item.Name
                            extension = $ext
                            size_bytes = $item.Length
                            modified_time = $item.LastWriteTime.ToString("o")
                            search_root = $root
                            root_priority = $rootPriority
                            extension_priority = $extPriority
                            size_score = $sizeScore
                            discovery_mode = "metadata_only"
                            file_content_read = $false
                        }
                    }
                } catch {
                    $errors.Add([ordered]@{
                        root = $root
                        message = $_.Exception.Message
                        category = "metadata_read_error"
                    })
                }
            }
        } catch {
            $errors.Add([ordered]@{
                root = $root
                message = $_.Exception.Message
                category = "rg_root_scan_exception"
            })
        }
    }
} else {
foreach ($root in $existingRoots) {
    try {
        $items = Get-ChildItem -LiteralPath $root -File -Recurse -Force -ErrorAction SilentlyContinue -ErrorVariable itemErrors |
            Where-Object { $targetExtensions -contains $_.Extension.ToUpperInvariant() }

        foreach ($err in $itemErrors) {
            $errors.Add([ordered]@{
                root = $root
                message = $err.Exception.Message
                category = $err.CategoryInfo.Category.ToString()
            })
        }

        foreach ($item in $items) {
            $fullPath = $item.FullName
            if (-not $candidatesByPath.Contains($fullPath)) {
                $ext = $item.Extension.ToUpperInvariant()
                $rootPriority = Get-RootPriority $fullPath
                $extPriority = $extensionPriority[$ext]
                $sizeScore = Get-SizeScore $item.Length
                $candidatesByPath[$fullPath] = [ordered]@{
                    path = $fullPath
                    basename = $item.Name
                    extension = $ext
                    size_bytes = $item.Length
                    modified_time = $item.LastWriteTime.ToString("o")
                    search_root = $root
                    root_priority = $rootPriority
                    extension_priority = $extPriority
                    size_score = $sizeScore
                    discovery_mode = "metadata_only"
                    file_content_read = $false
                }
            }
        }
    } catch {
        $errors.Add([ordered]@{
            root = $root
            message = $_.Exception.Message
            category = "root_scan_exception"
        })
    }
}
}

$rankedCandidates = @($candidatesByPath.Values | Sort-Object `
    @{ Expression = "root_priority"; Ascending = $true },
    @{ Expression = "extension_priority"; Ascending = $true },
    @{ Expression = "size_score"; Ascending = $true },
    @{ Expression = { [DateTime]::Parse($_.modified_time) }; Ascending = $false })

$strongCandidates = @($rankedCandidates | Where-Object {
    $_.root_priority -le 2 -and $_.extension -in @(".STY", ".SET") -and $_.size_bytes -gt 0
})

$status = "NO_FIXTURE_FOUND"
if ($rankedCandidates.Count -eq 1) {
    $status = "ONE_CANDIDATE_SELECTED"
} elseif ($strongCandidates.Count -eq 1 -and $rankedCandidates.Count -eq 1) {
    $status = "ONE_CANDIDATE_SELECTED"
} elseif ($rankedCandidates.Count -gt 1) {
    $status = "OWNER_SELECTION_REQUIRED"
}

$result = [ordered]@{
    status = $status
    run_root = $RunRoot
    discovery_mode = "metadata_only"
    searched_at = (Get-Date).ToString("o")
    target_extensions = $targetExtensions
    search_roots_requested = $searchRoots
    search_roots_existing = $existingRoots
    candidates_found_count = $rankedCandidates.Count
    strong_candidates_found_count = $strongCandidates.Count
    candidates = $rankedCandidates
    top_20 = @($rankedCandidates | Select-Object -First 20)
    errors = $errors
    safety = [ordered]@{
        read_only = $true
        file_content_read = $false
        files_modified = "reports_only"
        fixture_copied = $false
        usb_write = $false
        pa3x_load = $false
        writer_allowed = $false
    }
}

$jsonPath = Join-Path $resultDir "UAOS_FIXTURE_DISCOVERY_RESULTS.json"
$mdPath = Join-Path $resultDir "UAOS_FIXTURE_DISCOVERY_RESULTS.md"
$errorsPath = Join-Path $resultDir "UAOS_FIXTURE_DISCOVERY_ERRORS.md"

$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# UAOS Fixture Discovery Results")
$lines.Add("")
$lines.Add("Status: $status")
$lines.Add("Discovery mode: metadata only")
$lines.Add("Candidates found: $($rankedCandidates.Count)")
$lines.Add("Strong candidates found: $($strongCandidates.Count)")
$lines.Add("Fixture copied: NO")
$lines.Add("File content read: NO")
$lines.Add("")
$lines.Add("## Top Candidates")
if ($rankedCandidates.Count -eq 0) {
    $lines.Add("No candidates found.")
} else {
    $rank = 1
    foreach ($candidate in ($rankedCandidates | Select-Object -First 20)) {
        $lines.Add("$rank. $($candidate.path)")
        $lines.Add("   Extension: $($candidate.extension); Size: $($candidate.size_bytes); Modified: $($candidate.modified_time)")
        $rank += 1
    }
}
$lines | Set-Content -LiteralPath $mdPath -Encoding UTF8

$errorLines = New-Object System.Collections.Generic.List[string]
$errorLines.Add("# UAOS Fixture Discovery Errors")
$errorLines.Add("")
if ($errors.Count -eq 0) {
    $errorLines.Add("No discovery permission errors recorded.")
} else {
    foreach ($err in $errors) {
        $errorLines.Add("- Root: $($err.root)")
        $errorLines.Add("  Message: $($err.message)")
    }
}
$errorLines | Set-Content -LiteralPath $errorsPath -Encoding UTF8

Write-Output $jsonPath
