# UAOS V1711 - Owner Experimental CodeWriter MegaLauncher
# Single PowerShell script. Metadata-only owner experimental completion.
# Safety: no source file copy, no keyboard package writer, no USB write, no hardware load, no deploy, no payment.

[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\keyboard-manager-clean",
    [string]$OldSourceRoot = "C:\Users\ssare\Desktop\KORG_PA3X_RECOVERY_BACKUP_20260619-150450",
    [switch]$NoOpen,
    [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"

trap {
    Write-Host ""
    Write-Host "[FATAL] $($_.Exception.GetType().FullName): $($_.Exception.Message)" -ForegroundColor Red
    if ($_.InvocationInfo) {
        Write-Host "[FATAL] Script: $($_.InvocationInfo.ScriptName)" -ForegroundColor Red
        Write-Host "[FATAL] Line: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
        Write-Host "[FATAL] Command: $($_.InvocationInfo.Line)" -ForegroundColor Red
    }
    Write-Host ""
    break
}
# ================= UAOS V1711 AUTOPATCH HELPERS START =================

function Get-UAOSCanonicalPath {
    param([Parameter(Mandatory=$true)][string]$Path)
    try {
        $resolved = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
        if ($resolved) { return ([System.IO.Path]::GetFullPath($resolved.ProviderPath)).TrimEnd('\') }
        return ([System.IO.Path]::GetFullPath($Path)).TrimEnd('\')
    } catch {
        return $Path.TrimEnd('\')
    }
}

function Test-UAOSSamePath {
    param(
        [Parameter(Mandatory=$true)][string]$A,
        [Parameter(Mandatory=$true)][string]$B
    )
    $aa = Get-UAOSCanonicalPath -Path $A
    $bb = Get-UAOSCanonicalPath -Path $B
    return [string]::Equals($aa, $bb, [System.StringComparison]::OrdinalIgnoreCase)
}

function ConvertTo-UAOSInventoryRows {
    param(
        [Parameter(ValueFromPipeline=$true)]
        $InputObject,
        [string]$Source = "unknown"
    )

    begin { $rows = New-Object System.Collections.Generic.List[object] }

    process {
        if ($null -eq $InputObject) { return }

        $items = @()
        if ($InputObject -is [System.Array]) { $items = @($InputObject) }
        elseif ($InputObject.PSObject.Properties.Name -contains "items") { $items = @($InputObject.items) }
        elseif ($InputObject.PSObject.Properties.Name -contains "files") { $items = @($InputObject.files) }
        elseif ($InputObject.PSObject.Properties.Name -contains "rows") { $items = @($InputObject.rows) }
        elseif ($InputObject.PSObject.Properties.Name -contains "inventory") { $items = @($InputObject.inventory) }
        elseif ($InputObject.PSObject.Properties.Name -contains "data") { $items = @($InputObject.data) }
        else { $items = @($InputObject) }

        foreach ($item in $items) {
            if ($null -eq $item) { continue }

            $pathValue = $null
            $nameValue = $null
            $sizeValue = $null
            $modifiedValue = $null
            $hashValue = $null

            if ($item -is [string]) {
                $pathValue = $item
                $nameValue = [System.IO.Path]::GetFileName($item)
            } else {
                $props = @($item.PSObject.Properties)

                foreach ($candidate in @("FullName","FilePath","Path","path","file","relativePath","RelativePath")) {
                    $p = $props | Where-Object { [string]::Equals($_.Name,$candidate,[System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
                    if ($p -and $p.Value) { $pathValue = [string]$p.Value; break }
                }

                foreach ($candidate in @("Name","FileName","filename","name")) {
                    $p = $props | Where-Object { [string]::Equals($_.Name,$candidate,[System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
                    if ($p -and $p.Value) { $nameValue = [string]$p.Value; break }
                }

                foreach ($candidate in @("Length","Size","SizeBytes","sizeBytes","Bytes","bytes")) {
                    $p = $props | Where-Object { [string]::Equals($_.Name,$candidate,[System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
                    if ($p -and $null -ne $p.Value) {
                        try { $sizeValue = [int64]$p.Value } catch { $sizeValue = $null }
                        break
                    }
                }

                foreach ($candidate in @("LastWriteTimeUtc","ModifiedUtc","modifiedUtc","Modified","LastModified")) {
                    $p = $props | Where-Object { [string]::Equals($_.Name,$candidate,[System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
                    if ($p -and $p.Value) {
                        try { $modifiedValue = [datetime]$p.Value } catch { $modifiedValue = $null }
                        break
                    }
                }

                foreach ($candidate in @("Hash","SHA256","sha256","Checksum","checksum")) {
                    $p = $props | Where-Object { [string]::Equals($_.Name,$candidate,[System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
                    if ($p -and $p.Value) { $hashValue = [string]$p.Value; break }
                }
            }

            if ([string]::IsNullOrWhiteSpace($pathValue) -and [string]::IsNullOrWhiteSpace($nameValue)) { continue }

            if ([string]::IsNullOrWhiteSpace($nameValue) -and -not [string]::IsNullOrWhiteSpace($pathValue)) {
                $nameValue = [System.IO.Path]::GetFileName($pathValue)
            }

            $rows.Add([pscustomobject]@{
                Path        = [string]$pathValue
                Name        = [string]$nameValue
                SizeBytes   = $sizeValue
                ModifiedUtc = $modifiedValue
                Hash        = $hashValue
                Source      = [string]$Source
            }) | Out-Null
        }
    }

    end { return @($rows.ToArray()) }
}

function Get-UAOSPropertyValueSafe {
    param(
        [Parameter(Mandatory=$true)] $Row,
        [Parameter(Mandatory=$true)] [string[]]$Aliases
    )

    if ($null -eq $Row) { return $null }

    if ($Row -is [System.Collections.IDictionary]) {
        foreach ($alias in $Aliases) {
            foreach ($key in $Row.Keys) {
                if ([string]::Equals([string]$key, $alias, [System.StringComparison]::OrdinalIgnoreCase)) {
                    return $Row[$key]
                }
            }
        }
    }

    $props = @($Row.PSObject.Properties)
    foreach ($alias in $Aliases) {
        $match = $props | Where-Object { [string]::Equals($_.Name, $alias, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
        if ($match) { return $match.Value }
    }

    return $null
}

function ConvertTo-UAOSDataColumnValueSafe {
    param(
        [Parameter(Mandatory=$true)] [System.Data.DataColumn]$Column,
        $Value
    )

    $targetType = $Column.DataType

    if ($null -eq $Value -or $Value -is [DBNull]) {
        if ($Column.AllowDBNull) { return [DBNull]::Value }
        if ($targetType -eq [string])   { return "" }
        if ($targetType -eq [int])      { return [int]0 }
        if ($targetType -eq [int64])    { return [int64]0 }
        if ($targetType -eq [double])   { return [double]0 }
        if ($targetType -eq [decimal])  { return [decimal]0 }
        if ($targetType -eq [bool])     { return $false }
        if ($targetType -eq [datetime]) { return [datetime]::MinValue }
        return ""
    }

    try {
        if ($targetType -eq [string])   { return [string]$Value }
        if ($targetType -eq [int])      { return [int]$Value }
        if ($targetType -eq [int64])    { return [int64]$Value }
        if ($targetType -eq [double])   { return [double]$Value }
        if ($targetType -eq [decimal])  { return [decimal]$Value }
        if ($targetType -eq [bool])     { return [bool]$Value }
        if ($targetType -eq [datetime]) { return [datetime]$Value }
        return $Value
    } catch {
        if ($Column.AllowDBNull) { return [DBNull]::Value }
        if ($targetType -eq [string])   { return "" }
        if ($targetType -eq [int])      { return [int]0 }
        if ($targetType -eq [int64])    { return [int64]0 }
        if ($targetType -eq [double])   { return [double]0 }
        if ($targetType -eq [decimal])  { return [decimal]0 }
        if ($targetType -eq [bool])     { return $false }
        if ($targetType -eq [datetime]) { return [datetime]::MinValue }
        return ""
    }
}

function Get-UAOSDataTableColumnMappedValue {
    param(
        [Parameter(Mandatory=$true)] $Row,
        [Parameter(Mandatory=$true)] [string]$ColumnName
    )

    switch -Regex ($ColumnName) {
        '^(Path|FullName|FilePath)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("Path","FullName","FilePath","path","file") }
        '^(relativePath|RelativePath)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("relativePath","RelativePath","Path","FullName","FilePath") }
        '^(Name|FileName|filename)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("Name","FileName","filename","name") }
        '^(Size|SizeBytes|Length|Bytes|sizeBytes|bytes)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("SizeBytes","Length","Size","Bytes","sizeBytes","bytes") }
        '^(Modified|ModifiedUtc|LastWriteTimeUtc|LastModified|modifiedUtc)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("ModifiedUtc","LastWriteTimeUtc","Modified","LastModified","modifiedUtc") }
        '^(Hash|SHA256|sha256|Checksum|checksum)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("Hash","SHA256","sha256","Checksum","checksum") }
        '^(Source)$' { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @("Source","source") }
        default { return Get-UAOSPropertyValueSafe -Row $Row -Aliases @($ColumnName) }
    }
}

function Add-UAOSDataTableRowSafe {
    param(
        [Parameter(Mandatory=$true)] [System.Data.DataTable]$DataTable,
        [Parameter(Mandatory=$true)] $Row
    )

    $values = New-Object System.Collections.Generic.List[object]
    foreach ($col in $DataTable.Columns) {
        $rawValue = Get-UAOSDataTableColumnMappedValue -Row $Row -ColumnName ([string]$col.ColumnName)
        $safeValue = ConvertTo-UAOSDataColumnValueSafe -Column $col -Value $rawValue
        $values.Add($safeValue) | Out-Null
    }
    [void]$DataTable.Rows.Add([object[]]$values.ToArray())
}

# ================= UAOS V1711 AUTOPATCH HELPERS END =================



$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

# -----------------------------
# UAOS V1711 constants
# -----------------------------
$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$PhaseName = "uaos-v1711-owner-experimental-codewriter"
$PhaseRoot = Join-Path $FactoryRoot $PhaseName
$AllowedWriterMode = "OWNER_EXPERIMENTAL_CODEWRITER_METADATA_ONLY"
$ExpectedPriorCount = 305
$ScriptFileName = "RUN_UAOS_V1711_OWNER_EXPERIMENTAL_CODEWRITER_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptFileName

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$PackageDir = Join-Path $PhaseRoot "package"
$IntegrationDir = Join-Path $PhaseRoot "owner-site-integration"
$LogsDir = Join-Path $PhaseRoot "logs"
$CodeWriterDir = Join-Path $PhaseRoot "codewriter"

$ReviewQueueJson = Join-Path $DataDir "UAOS_V1711_OWNER_EXPERIMENTAL_REVIEW_QUEUE.json"
$ReviewQueueCsv = Join-Path $DataDir "UAOS_V1711_OWNER_EXPERIMENTAL_REVIEW_QUEUE.csv"
$DecisionTemplateCsv = Join-Path $DataDir "UAOS_V1711_OWNER_DECISION_TEMPLATE.csv"
$ExtensionSummaryCsv = Join-Path $DataDir "UAOS_V1711_EXTENSION_SUMMARY.csv"
$ClassificationSummaryCsv = Join-Path $DataDir "UAOS_V1711_CLASSIFICATION_SUMMARY.csv"
$FolderSummaryCsv = Join-Path $DataDir "UAOS_V1711_FOLDER_SUMMARY.csv"
$SafetyLedgerJson = Join-Path $DataDir "UAOS_V1711_SAFETY_LEDGER.json"
$ManifestJson = Join-Path $DataDir "UAOS_V1711_MANIFEST.json"

$WorkspaceHtml = Join-Path $WorkspaceDir "UAOS_V1711_OWNER_EXPERIMENTAL_WORKSPACE.html"
$IntegrationHtml = Join-Path $IntegrationDir "UAOS_V1711_OWNER_SITE_LINK_BLOCK.html"
$CodeWriterMissionMd = Join-Path $CodeWriterDir "CODEWRITER_OWNER_EXPERIMENTAL_MISSION.md"
$CodeWriterPatchPlanJson = Join-Path $CodeWriterDir "CODEWRITER_PATCH_PLAN.json"
$CodeWriterHandoffMd = Join-Path $CodeWriterDir "CODEWRITER_HANDOFF.md"

$ValidationJson = Join-Path $ValidationDir "UAOS_V1711_VALIDATION.json"
$ReportMd = Join-Path $ReportsDir "UAOS_V1711_OWNER_EXPERIMENTAL_REPORT.md"
$SealMd = Join-Path $SealDir "UAOS_V1711_FINAL_OWNER_EXPERIMENTAL_SEAL.md"
$RunLog = Join-Path $LogsDir "UAOS_V1711_MEGALAUNCHER_RUN.log"
$PackageZip = Join-Path $PackageDir "UAOS_V1711_OWNER_EXPERIMENTAL_CODEWRITER_PACKAGE.zip"

$ForbiddenKeyboardExts = @(
    ".SET", ".PCM", ".STY", ".PRF", ".PCG", ".PAD", ".KMP", ".KSF",
    ".SBD", ".SBL", ".GBL", ".VOC", ".MXP", ".BKP", ".KSC", ".KST",
    ".PRG", ".PCG", ".DK", ".DKP"
)

$ForbiddenSourceFolderRegex = "(^|[\\/])[^\\/]+\.SET([\\/]|$)"
$AllowedGeneratedExts = @(".json", ".csv", ".md", ".html", ".txt", ".ps1", ".zip", ".log")

# -----------------------------
# Output helpers
# -----------------------------
function New-UaosDirectory {
    param([Parameter(Mandatory=$true)][string]$Path)
    if (!(Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-UaosLine {
    param(
        [Parameter(Mandatory=$true)][string]$Message,
        [string]$Level = "INFO",
        [ConsoleColor]$Color = [ConsoleColor]::Gray
    )
    $stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$stamp] [$Level] $Message"
    Write-Host $line -ForegroundColor $Color
    try {
        if ($RunLog) {
            $line | Add-Content -Path $RunLog -Encoding UTF8
        }
    } catch {
        # Logging must never break the launcher.
    }
}

function Write-UaosStep { param([string]$Message) Write-UaosLine -Message $Message -Level "STEP" -Color Cyan }
function Write-UaosOk { param([string]$Message) Write-UaosLine -Message $Message -Level "PASS" -Color Green }
function Write-UaosWarn { param([string]$Message) Write-UaosLine -Message $Message -Level "WARN" -Color Yellow }
function Write-UaosFail { param([string]$Message) Write-UaosLine -Message $Message -Level "FAIL" -Color Red }

function ConvertTo-UaosSafeJson {
    param([AllowNull()][object]$InputObject)
    return ($InputObject | ConvertTo-Json -Depth 100)
}

function Get-UaosSha256 {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path) -or !(Test-Path -LiteralPath $Path)) { return "" }
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

function HtmlEncode-Uaos {
    param([AllowNull()][object]$Value)
    $text = [string]$Value
    try {
        return [System.Net.WebUtility]::HtmlEncode($text)
    } catch {
        return [System.Security.SecurityElement]::Escape($text)
    }
}

function Get-UaosFileUri {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return "" }
    try {
        $fullPath = [System.IO.Path]::GetFullPath($Path)
        return ([System.Uri]::new($fullPath)).AbsoluteUri
    } catch {
        try {
            return ([System.Uri]::new($Path)).AbsoluteUri
        } catch {
            return $Path
        }
    }
}

function Get-UaosCollectionCount {
    param([AllowNull()][object]$Value)
    if ($null -eq $Value) { return 0 }
    if ($Value -is [string]) { return 1 }
    if ($Value -is [System.Array]) { return [int]$Value.Length }
    if ($Value -is [System.Collections.ICollection]) { return [int]$Value.Count }
    if ($Value -is [System.Collections.IEnumerable]) {
        $count = 0
        foreach ($item in $Value) { $count++ }
        return [int]$count
    }
    return 1
}

function Get-UaosPropertyValue {
    param(
        [AllowNull()][object]$Object,
        [Parameter(Mandatory=$true)][string[]]$Names,
        [AllowNull()][object]$Default = $null
    )
    if ($null -eq $Object) { return $Default }
    $props = @($Object.PSObject.Properties)
    foreach ($name in $Names) {
        foreach ($prop in $props) {
            if ($prop.Name -ieq $name) {
                return $prop.Value
            }
        }
    }
    return $Default
}

function ConvertTo-UaosInt64 {
    param([AllowNull()][object]$Value)
    if ($null -eq $Value) { return [int64]0 }
    try {
        if ($Value -is [int64]) { return $Value }
        if ($Value -is [int]) { return [int64]$Value }
        if ($Value -is [double]) { return [int64]$Value }
        $s = ([string]$Value).Trim()
        if ([string]::IsNullOrWhiteSpace($s)) { return [int64]0 }
        return [int64]$s
    } catch {
        return [int64]0
    }
}

function Normalize-UaosExtension {
    param([AllowNull()][object]$Extension, [AllowNull()][string]$Path)
    $ext = ([string]$Extension).Trim()
    if ([string]::IsNullOrWhiteSpace($ext) -and ![string]::IsNullOrWhiteSpace($Path)) {
        $ext = [System.IO.Path]::GetExtension($Path)
    }
    if ([string]::IsNullOrWhiteSpace($ext)) { return "" }
    if (!$ext.StartsWith(".")) { $ext = "." + $ext }
    return $ext.ToLowerInvariant()
}

function Get-UaosRelativePath {
    param(
        [string]$BasePath,
        [string]$FullPath
    )
    if ([string]::IsNullOrWhiteSpace($FullPath)) { return "" }
    if ([string]::IsNullOrWhiteSpace($BasePath)) { return $FullPath }

    try {
        $baseFull = [System.IO.Path]::GetFullPath($BasePath).TrimEnd([char]'\', [char]'/')
        $fullFull = [System.IO.Path]::GetFullPath($FullPath)
        $comparison = [System.StringComparison]::OrdinalIgnoreCase
        if ($fullFull.StartsWith($baseFull, $comparison)) {
            $rel = $fullFull.Substring($baseFull.Length).TrimStart([char]'\', [char]'/')
            if ([string]::IsNullOrWhiteSpace($rel)) { return [System.IO.Path]::GetFileName($fullFull) }
            return $rel
        }
        return $FullPath
    } catch {
        return $FullPath
    }
}

function Get-UaosTopFolder {
    param([AllowNull()][string]$RelativePath)
    if ([string]::IsNullOrWhiteSpace($RelativePath)) { return "_UNKNOWN" }
    $normalized = $RelativePath -replace "/", "\"
    $parts = @($normalized -split "\\")
    if ($parts.Count -gt 1) { return $parts[0] }
    return "_ROOT"
}

function Get-UaosParentFolder {
    param([AllowNull()][string]$RelativePath)
    if ([string]::IsNullOrWhiteSpace($RelativePath)) { return "_UNKNOWN" }
    $normalized = $RelativePath -replace "/", "\"
    $parent = Split-Path -Path $normalized -Parent
    if ([string]::IsNullOrWhiteSpace($parent)) { return "_ROOT" }
    return $parent
}

function Test-UaosInsideForbiddenFolder {
    param([AllowNull()][string]$RelativePath)
    if ([string]::IsNullOrWhiteSpace($RelativePath)) { return $false }
    return ([regex]::IsMatch($RelativePath, $ForbiddenSourceFolderRegex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase))
}

function Get-UaosClassification {
    param(
        [AllowNull()][string]$Extension,
        [AllowNull()][string]$RelativePath
    )
    $extUpper = ([string]$Extension).ToUpperInvariant()
    if (Test-UaosInsideForbiddenFolder -RelativePath $RelativePath) {
        return "BLOCKED_INSIDE_FORBIDDEN_SOURCE_FOLDER"
    }
    if ($ForbiddenKeyboardExts -contains $extUpper) {
        return "BLOCKED_FORBIDDEN_FILE_EXTENSION"
    }
    return "BLOCKED_UNAPPROVED_EXTENSION"
}

function Get-UaosRiskTier {
    param(
        [AllowNull()][string]$Extension,
        [AllowNull()][string]$Classification
    )
    $ext = ([string]$Extension).ToUpperInvariant()
    if ($ext -in @(".PCM", ".BKP", ".SET", ".STY", ".PRF", ".PCG")) { return "RED" }
    if (([string]$Classification) -eq "BLOCKED_INSIDE_FORBIDDEN_SOURCE_FOLDER") { return "RED" }
    if ($ForbiddenKeyboardExts -contains $ext) { return "ORANGE" }
    return "YELLOW"
}

function Get-UaosBlockedReason {
    param(
        [AllowNull()][string]$Extension,
        [AllowNull()][string]$Classification,
        [AllowNull()][string]$RelativePath,
        [AllowNull()][string]$ExistingReason
    )
    if (![string]::IsNullOrWhiteSpace($ExistingReason)) { return $ExistingReason }
    switch ([string]$Classification) {
        "BLOCKED_INSIDE_FORBIDDEN_SOURCE_FOLDER" { return "Source path is inside a keyboard .SET-style folder. Metadata review only." }
        "BLOCKED_FORBIDDEN_FILE_EXTENSION" { return "Keyboard/proprietary or high-risk extension. Copy/write/export remains blocked." }
        "BLOCKED_UNAPPROVED_EXTENSION" { return "Extension is not approved for safe copy in owner experimental stage." }
        default { return "Metadata-only safety lock." }
    }
}

function Import-UaosJsonLoose {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path) -or !(Test-Path -LiteralPath $Path)) { return $null }
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    try {
        return ($raw | ConvertFrom-Json)
    } catch {
        Write-UaosWarn ("JSON parse failed: " + $Path + " :: " + $_.Exception.Message)
        return $null
    }
}

function Get-UaosRowsFromJsonObject {
    param([AllowNull()][object]$JsonObject)

    if ($null -eq $JsonObject) { return @() }

    if ($JsonObject -is [array]) {
        return @($JsonObject)
    }

    $candidateNames = @(
        "rows",
        "files",
        "blocked_files",
        "blockedFiles",
        "inventory",
        "items",
        "source_files",
        "sourceFiles",
        "review_rows",
        "reviewRows",
        "data"
    )

    foreach ($name in $candidateNames) {
        $value = Get-UaosPropertyValue -Object $JsonObject -Names @($name) -Default $null
        if ($null -ne $value) {
            if ($value -is [array]) {
                return @($value)
            }
            $nested = @(Get-UaosRowsFromJsonObject -JsonObject $value)
            if ($nested.Count -gt 0) {
                return $nested
            }
        }
    }

    $looksLikeRow = $false
    foreach ($rowPropName in @("relative_path","RelativePath","path","Path","full_path","FullName","name","Name","file_name","FileName")) {
        $candidate = Get-UaosPropertyValue -Object $JsonObject -Names @($rowPropName) -Default $null
        if ($null -ne $candidate -and ![string]::IsNullOrWhiteSpace([string]$candidate)) {
            $looksLikeRow = $true
            break
        }
    }

    if ($looksLikeRow) {
        return @($JsonObject)
    }

    return @()
}

function Find-UaosInventoryFile {
    param([string]$FactoryRoot)

    $known = @(
        (Join-Path $FactoryRoot "uaos-v1710-final-safe-owner-completion\package\contents\virtual-set\02_SOURCE_INVENTORY\UAOS_BLOCKED_FILE_INVENTORY.json"),
        (Join-Path $FactoryRoot "uaos-v1708-v1710-final-safe-owner-completion\package\contents\virtual-set\02_SOURCE_INVENTORY\UAOS_BLOCKED_FILE_INVENTORY.json"),
        (Join-Path $FactoryRoot "uaos-v1705-virtual-new-set-inventory-builder\package\contents\virtual-set\02_SOURCE_INVENTORY\UAOS_BLOCKED_FILE_INVENTORY.json"),
        (Join-Path $FactoryRoot "uaos-v1705-virtual-new-set-inventory-builder\data\UAOS_BLOCKED_FILE_INVENTORY.json")
    )

    foreach ($path in $known) {
        if (Test-Path -LiteralPath $path) {
            return $path
        }
    }

    if (Test-Path -LiteralPath $FactoryRoot) {
        try {
            $found = @(Get-ChildItem -LiteralPath $FactoryRoot -Filter "UAOS_BLOCKED_FILE_INVENTORY.json" -Recurse -File -ErrorAction SilentlyContinue)
            if ($found.Count -gt 0) {
                $ranked = @($found | Sort-Object LastWriteTime -Descending)
                return $ranked[0].FullName
            }
        } catch {
            Write-UaosWarn ("Inventory search skipped: " + $_.Exception.Message)
        }
    }

    return ""
}

function New-UaosReviewRow {
    param(
        [Parameter(Mandatory=$true)][int]$RowNumber,
        [AllowNull()][object]$SourceObject,
        [string]$OriginMode,
        [string]$OriginPath
    )

    $sourcePath = [string](Get-UaosPropertyValue -Object $SourceObject -Names @("source_path","sourcePath","full_path","fullPath","FullName","Path","path") -Default "")
    $relativePath = [string](Get-UaosPropertyValue -Object $SourceObject -Names @("relative_path","relativePath","RelativePath","rel_path","relPath") -Default "")
    $fileName = [string](Get-UaosPropertyValue -Object $SourceObject -Names @("file_name","fileName","FileName","Name","name") -Default "")

    if ([string]::IsNullOrWhiteSpace($relativePath)) {
        if (![string]::IsNullOrWhiteSpace($sourcePath) -and (Test-Path -LiteralPath $OldSourceRoot)) {
            $relativePath = Get-UaosRelativePath -BasePath $OldSourceRoot -FullPath $sourcePath
        } elseif (![string]::IsNullOrWhiteSpace($sourcePath)) {
            $relativePath = $sourcePath
        } elseif (![string]::IsNullOrWhiteSpace($fileName)) {
            $relativePath = $fileName
        } else {
            $relativePath = "UNKNOWN_ROW_$RowNumber"
        }
    }

    if ([string]::IsNullOrWhiteSpace($fileName)) {
        $fileName = [System.IO.Path]::GetFileName($relativePath)
        if ([string]::IsNullOrWhiteSpace($fileName) -and ![string]::IsNullOrWhiteSpace($sourcePath)) {
            $fileName = [System.IO.Path]::GetFileName($sourcePath)
        }
    }

    $extRaw = Get-UaosPropertyValue -Object $SourceObject -Names @("extension","Extension","ext","Ext") -Default ""
    $extension = Normalize-UaosExtension -Extension $extRaw -Path $relativePath
    if ([string]::IsNullOrWhiteSpace($extension) -and ![string]::IsNullOrWhiteSpace($sourcePath)) {
        $extension = Normalize-UaosExtension -Extension "" -Path $sourcePath
    }

    $bytesValue = Get-UaosPropertyValue -Object $SourceObject -Names @("bytes","Bytes","size","Size","length","Length","size_bytes","sizeBytes") -Default 0
    $bytes = ConvertTo-UaosInt64 -Value $bytesValue

    $classification = [string](Get-UaosPropertyValue -Object $SourceObject -Names @("classification","Classification","class","Class") -Default "")
    if ([string]::IsNullOrWhiteSpace($classification)) {
        $classification = Get-UaosClassification -Extension $extension -RelativePath $relativePath
    }

    $blockedReason = [string](Get-UaosPropertyValue -Object $SourceObject -Names @("blocked_reason","blockedReason","reason","Reason") -Default "")
    $blockedReason = Get-UaosBlockedReason -Extension $extension -Classification $classification -RelativePath $relativePath -ExistingReason $blockedReason
    $riskTier = Get-UaosRiskTier -Extension $extension -Classification $classification
    $topFolder = Get-UaosTopFolder -RelativePath $relativePath
    $sourceFolder = Get-UaosParentFolder -RelativePath $relativePath

    return [pscustomobject][ordered]@{
        review_id = ("V1711-R{0:D4}" -f $RowNumber)
        row_number = $RowNumber
        extension = $extension
        file_name = $fileName
        relative_path = $relativePath
        source_top_folder = $topFolder
        source_folder = $sourceFolder
        bytes = [int64]$bytes
        classification = $classification
        risk_tier = $riskTier
        blocked_reason = $blockedReason
        safe_copy_allowed = $false
        safe_copy_allowed_text = "NO"
        writer_ready = $false
        writer_mode = $AllowedWriterMode
        owner_decision = "PENDING_REVIEW"
        allowed_decisions = "PENDING_REVIEW;KEEP_BLOCKED;DOCUMENT_ONLY;REQUEST_SEPARATE_APPROVAL_PHASE"
        proposed_next_action = "OWNER_REVIEW_METADATA_ONLY"
        reviewer_notes = ""
        source_file_open_enabled = $false
        source_file_copy_enabled = $false
        source_origin_mode = $OriginMode
        source_origin_path = $OriginPath
    }
}

function Build-UaosRowsFromInventory {
    param([string]$InventoryPath)
    $json = Import-UaosJsonLoose -Path $InventoryPath
    $rawRows = @(Get-UaosRowsFromJsonObject -JsonObject $json)
    $rows = New-Object System.Collections.Generic.List[object]
    $rowNumber = 0

    foreach ($rawRow in $rawRows) {
        $rowNumber++
        $rows.Add((New-UaosReviewRow -RowNumber $rowNumber -SourceObject $rawRow -OriginMode "JSON_INVENTORY" -OriginPath $InventoryPath)) | Out-Null
    }

    return $rows.ToArray()
}

function Build-UaosRowsFromDirectScan {
    param([string]$SourceRoot)
    if (!(Test-Path -LiteralPath $SourceRoot)) {
        throw "Old source root not found: $SourceRoot"
    }

    $files = @(Get-ChildItem -LiteralPath $SourceRoot -Recurse -File -ErrorAction Stop)
    $rows = New-Object System.Collections.Generic.List[object]
    $rowNumber = 0

    foreach ($file in $files) {
        $rowNumber++
        $relative = Get-UaosRelativePath -BasePath $SourceRoot -FullPath $file.FullName
        $scanObj = [pscustomobject][ordered]@{
            full_path = $file.FullName
            relative_path = $relative
            file_name = $file.Name
            extension = $file.Extension
            bytes = [int64]$file.Length
        }
        $rows.Add((New-UaosReviewRow -RowNumber $rowNumber -SourceObject $scanObj -OriginMode "DIRECT_METADATA_SCAN" -OriginPath $SourceRoot)) | Out-Null
    }

    return $rows.ToArray()
}

function Get-UaosByteSum {
    param([AllowNull()][object[]]$Items)
    if ($null -eq $Items) { return [int64]0 }
    $measure = $Items | Measure-Object -Property bytes -Sum
    if ($null -eq $measure -or $null -eq $measure.Sum) { return [int64]0 }
    return [int64]$measure.Sum
}

function Build-UaosSummary {
    param(
        [Parameter(Mandatory=$true)][object[]]$Rows,
        [Parameter(Mandatory=$true)][string]$GroupProperty
    )

    $result = New-Object System.Collections.Generic.List[object]
    $groups = @($Rows | Group-Object -Property $GroupProperty)
    $groups = @($groups | Sort-Object -Property Count -Descending)

    foreach ($group in $groups) {
        $items = @($group.Group)
        $blockedItems = @($items | Where-Object { $_.safe_copy_allowed -ne $true })
        $safeItems = @($items | Where-Object { $_.safe_copy_allowed -eq $true })
        $name = [string]$group.Name
        if ([string]::IsNullOrWhiteSpace($name)) { $name = "[blank]" }

        $payload = [ordered]@{
            name = $name
            count = [int](Get-UaosCollectionCount -Value $items)
            blocked = [int](Get-UaosCollectionCount -Value $blockedItems)
            safe_copy_allowed = [int](Get-UaosCollectionCount -Value $safeItems)
            total_bytes = [int64](Get-UaosByteSum -Items $items)
        }

        if ($GroupProperty -ieq "extension") { $payload["extension"] = $name }
        if ($GroupProperty -ieq "classification") { $payload["classification"] = $name }
        if ($GroupProperty -ieq "source_top_folder") { $payload["source_top_folder"] = $name }

        $result.Add(([pscustomobject]$payload)) | Out-Null
    }

    return $result.ToArray()
}

function Copy-UaosDirectoryToStage {
    param(
        [string]$Source,
        [string]$DestinationRoot
    )
    if (!(Test-Path -LiteralPath $Source)) { return }
    $name = Split-Path -Path $Source -Leaf
    $destination = Join-Path $DestinationRoot $name
    if (Test-Path -LiteralPath $destination) {
        Remove-Item -LiteralPath $destination -Recurse -Force
    }
    Copy-Item -LiteralPath $Source -Destination $destination -Recurse -Force
}

function Test-UaosNoForbiddenGeneratedFiles {
    param([string]$Root)
    $bad = New-Object System.Collections.Generic.List[object]
    if (Test-Path -LiteralPath $Root) {
        $generated = @(Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue)
        foreach ($file in $generated) {
            $ext = ([string]$file.Extension).ToUpperInvariant()
            if ($ForbiddenKeyboardExts -contains $ext) {
                $bad.Add($file.FullName) | Out-Null
            }
        }
    }
    return $bad.ToArray()
}

# -----------------------------
# Start
# -----------------------------
foreach ($dir in @($FactoryRoot, $PhaseRoot, $DataDir, $WorkspaceDir, $ReportsDir, $ValidationDir, $SealDir, $PackageDir, $IntegrationDir, $LogsDir, $CodeWriterDir)) {
    New-UaosDirectory -Path $dir
}

Write-UaosStep "UAOS V1711 Owner Experimental CodeWriter MegaLauncher started"
Write-UaosLine ("RepoRoot: " + $RepoRoot)
Write-UaosLine ("FactoryRoot: " + $FactoryRoot)
Write-UaosLine ("OldSourceRoot: " + $OldSourceRoot)
Write-UaosLine ("Mode: " + $AllowedWriterMode)
Write-UaosLine "Safety locks: writer_ready=false; safe_copy_allowed=0; no USB; no hardware; no deploy; no payment."

# Preserve this launcher inside the factory root so the project remains MegaLauncher-one-script.
try {
    $currentScript = $PSCommandPath
    if ([string]::IsNullOrWhiteSpace($currentScript)) {
        $currentScript = $MyInvocation.MyCommand.Path
    }
    if (![string]::IsNullOrWhiteSpace($currentScript) -and (Test-Path -LiteralPath $currentScript)) {
        Copy-Item -LiteralPath $currentScript -Destination $FactoryScriptPath -Force
        Write-UaosOk ("MegaLauncher copied to factory: " + $FactoryScriptPath)
    }
} catch {
    Write-UaosWarn ("Could not copy MegaLauncher into factory: " + $_.Exception.Message)
}

# -----------------------------
# Load existing inventory or scan directly
# -----------------------------
Write-UaosStep "Loading inventory with Count-safe parser"
$InventoryPath = Find-UaosInventoryFile -FactoryRoot $FactoryRoot
$InventorySourceMode = ""
$InventorySourcePath = ""
$ReviewRows = @()

if (![string]::IsNullOrWhiteSpace($InventoryPath)) {
    Write-UaosLine ("Found inventory: " + $InventoryPath)
    $ReviewRows = @(Build-UaosRowsFromInventory -InventoryPath $InventoryPath)
    if ($ReviewRows.Count -gt 0) {
        $InventorySourceMode = "JSON_INVENTORY"
        $InventorySourcePath = $InventoryPath
        Write-UaosOk ("Loaded inventory rows: " + $ReviewRows.Count)
    } else {
        Write-UaosWarn "Inventory exists but produced 0 rows. Falling back to direct metadata scan."
    }
}

if ($ReviewRows.Count -eq 0) {
    Write-UaosStep ("DIRECT_METADATA_SCAN: " + $OldSourceRoot)
    $ReviewRows = @(Build-UaosRowsFromDirectScan -SourceRoot $OldSourceRoot)
    $InventorySourceMode = "DIRECT_METADATA_SCAN"
    $InventorySourcePath = $OldSourceRoot
    Write-UaosOk ("Direct metadata rows: " + $ReviewRows.Count)
}

# Stable row ordering by folder/path; keep ids deterministic after load/scan.
$ReviewRows = @($ReviewRows | Sort-Object -Property relative_path)
$renumbered = New-Object System.Collections.Generic.List[object]
$rowNumber2 = 0
foreach ($row in $ReviewRows) {
    $rowNumber2++
    $row.review_id = ("V1711-R{0:D4}" -f $rowNumber2)
    $row.row_number = $rowNumber2
    $renumbered.Add($row) | Out-Null
}
# UAOS V1711 V4 SAFE REVIEW ROWS START
$__uaosReviewRowsList = New-Object System.Collections.Generic.List[object]
try {
    if ($null -ne $renumbered) {
        $renumbered | ForEach-Object {
            if ($null -ne $_) {
                $__uaosReviewRowsList.Add([object]$_) | Out-Null
            }
        }
    }

    $ReviewRows = @($__uaosReviewRowsList.ToArray())
    Write-Host "[INFO] ReviewRows safe conversion rows: $(@($ReviewRows).Count)"
}
catch {
    Write-Host "[WARN] ReviewRows pipeline conversion failed: $($_.Exception.Message)"

    $__uaosReviewRowsList = New-Object System.Collections.Generic.List[object]
    try {
        foreach ($__uaosRow in ([object[]]$renumbered)) {
            if ($null -ne $__uaosRow) {
                $__uaosReviewRowsList.Add([object]$__uaosRow) | Out-Null
            }
        }

        $ReviewRows = @($__uaosReviewRowsList.ToArray())
        Write-Host "[INFO] ReviewRows fallback conversion rows: $(@($ReviewRows).Count)"
    }
    catch {
        Write-Host "[FATAL] ReviewRows fallback failed: $($_.Exception.Message)"
        if ($null -ne $renumbered) {
            Write-Host "[FATAL] renumbered type: $($renumbered.GetType().FullName)"
        }
        throw
    }
}
# UAOS V1711 V4 SAFE REVIEW ROWS END

# -----------------------------
# Summaries and data exports
# -----------------------------
Write-UaosStep "Building owner experimental metadata outputs"
$TotalRows = [int](Get-UaosCollectionCount -Value $ReviewRows)
$TotalBytes = [int64](Get-UaosByteSum -Items $ReviewRows)
$BlockedRows = @($ReviewRows | Where-Object { $_.safe_copy_allowed -ne $true })
$SafeRows = @($ReviewRows | Where-Object { $_.safe_copy_allowed -eq $true })
$WriterReadyTrueRows = @($ReviewRows | Where-Object { $_.writer_ready -eq $true })
$BlockedCount = [int](Get-UaosCollectionCount -Value $BlockedRows)
$SafeCopyAllowedCount = [int](Get-UaosCollectionCount -Value $SafeRows)
$WriterReadyTrueCount = [int](Get-UaosCollectionCount -Value $WriterReadyTrueRows)

$ExtensionSummary = @(Build-UaosSummary -Rows $ReviewRows -GroupProperty "extension")
$ClassificationSummary = @(Build-UaosSummary -Rows $ReviewRows -GroupProperty "classification")
$FolderSummary = @(Build-UaosSummary -Rows $ReviewRows -GroupProperty "source_top_folder")

$DecisionTemplate = New-Object System.Collections.Generic.List[object]
foreach ($row in $ReviewRows) {
    $DecisionTemplate.Add(([pscustomobject][ordered]@{
        review_id = $row.review_id
        relative_path = $row.relative_path
        extension = $row.extension
        classification = $row.classification
        risk_tier = $row.risk_tier
        current_state = "BLOCKED_METADATA_ONLY"
        owner_decision = "PENDING_REVIEW"
        allowed_decisions = "PENDING_REVIEW;KEEP_BLOCKED;DOCUMENT_ONLY;REQUEST_SEPARATE_APPROVAL_PHASE"
        owner_notes = ""
    })) | Out-Null
}

(ConvertTo-UaosSafeJson -InputObject $ReviewRows) | Set-Content -Path $ReviewQueueJson -Encoding UTF8
$ReviewRows | Export-Csv -Path $ReviewQueueCsv -NoTypeInformation -Encoding UTF8
$DecisionTemplate | Export-Csv -Path $DecisionTemplateCsv -NoTypeInformation -Encoding UTF8
$ExtensionSummary | Export-Csv -Path $ExtensionSummaryCsv -NoTypeInformation -Encoding UTF8
$ClassificationSummary | Export-Csv -Path $ClassificationSummaryCsv -NoTypeInformation -Encoding UTF8
$FolderSummary | Export-Csv -Path $FolderSummaryCsv -NoTypeInformation -Encoding UTF8

$SafetyLedger = [pscustomobject][ordered]@{
    phase = "UAOS V1711"
    stage = "OWNER_EXPERIMENTAL_CODEWRITER"
    created_at = (Get-Date).ToString("s")
    inventory_source_mode = $InventorySourceMode
    inventory_source_path = $InventorySourcePath
    writer_ready = $false
    writer_mode = $AllowedWriterMode
    safe_copy_allowed_count = 0
    real_keyboard_binary_writer = "NO"
    keyboard_package_output_generated = "NO"
    forbidden_keyboard_extensions_generated = "NO"
    forbidden_keyboard_extensions_copied = "NO"
    source_files_copied = "NO"
    usb_write = "NO"
    hardware_load = "NO"
    deploy = "NO"
    payment = "NO"
    compatibility_claims = "NO"
    allowed_outputs = @("json","csv","md","html","txt","ps1","zip","log")
    blocked_extensions = $ForbiddenKeyboardExts
    count_safety_note = "No direct .Count dependency on JSON root object. Arrays are normalized with @(...)."
    foreach_safety_note = "Critical option and summary generation use explicit foreach loops instead of fragile ForEach-Object pipelines."
}
(ConvertTo-UaosSafeJson -InputObject $SafetyLedger) | Set-Content -Path $SafetyLedgerJson -Encoding UTF8

Write-UaosOk ("Rows: " + $TotalRows)
Write-UaosOk ("Blocked metadata-only: " + $BlockedCount)
Write-UaosOk ("Safe copy allowed: " + $SafeCopyAllowedCount)
Write-UaosOk ("Writer-ready true rows: " + $WriterReadyTrueCount)

# -----------------------------
# Owner experimental workspace
# -----------------------------
Write-UaosStep "Writing owner experimental HTML workspace"

$RowsJsonForHtml = (ConvertTo-UaosSafeJson -InputObject $ReviewRows) -replace "</script", "<\/script"
$ExtSummaryJsonForHtml = (ConvertTo-UaosSafeJson -InputObject $ExtensionSummary) -replace "</script", "<\/script"
$ClassSummaryJsonForHtml = (ConvertTo-UaosSafeJson -InputObject $ClassificationSummary) -replace "</script", "<\/script"
$FolderSummaryJsonForHtml = (ConvertTo-UaosSafeJson -InputObject $FolderSummary) -replace "</script", "<\/script"

$WorkspaceTemplate = @'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>UAOS V1711 Owner Experimental CodeWriter Workspace</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root { color-scheme: dark; }
body { margin:0; font-family:Segoe UI, Arial, sans-serif; background:#08111f; color:#eef5ff; }
header { padding:26px 30px; background:#0e1b30; border-bottom:1px solid #20314b; }
h1 { margin:0 0 10px; font-size:24px; }
h2 { margin-top:0; }
.wrap { padding:22px 30px 34px; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; }
.card { background:#0f1b2e; border:1px solid #253a58; border-radius:16px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,.18); }
.metric { font-size:30px; font-weight:800; margin-top:6px; }
.small { color:#aebfd4; font-size:13px; line-height:1.5; }
.badge { display:inline-block; margin:4px 6px 4px 0; padding:5px 8px; border-radius:999px; border:1px solid #375577; background:#142642; font-size:12px; }
.pass { border-color:#2e8b57; background:#12351f; }
.warn { border-color:#9b7c2e; background:#372b10; }
.block { border-color:#914444; background:#3a1618; }
.toolbar { display:flex; flex-wrap:wrap; gap:10px; margin:12px 0; }
input, select, button, .btn { background:#142642; color:#eef5ff; border:1px solid #426187; border-radius:10px; padding:9px 11px; }
button, .btn { cursor:pointer; text-decoration:none; display:inline-block; }
button:hover, .btn:hover { background:#1f375c; }
.tableWrap { overflow:auto; border:1px solid #243854; border-radius:14px; max-height:620px; }
table { border-collapse:collapse; width:100%; min-width:1450px; }
th,td { padding:9px 10px; border-bottom:1px solid #1f3048; vertical-align:top; }
th { position:sticky; top:0; background:#13233b; text-align:left; z-index:1; }
tr:hover td { background:#101f36; }
.path { font-family:Consolas, monospace; color:#cfe5ff; word-break:break-all; }
.risk-RED { color:#ffb1b1; font-weight:700; }
.risk-ORANGE { color:#ffd28a; font-weight:700; }
.risk-YELLOW { color:#fff0a2; font-weight:700; }
footer { padding:20px 30px 30px; color:#9eb1c9; }
textarea { min-width:240px; min-height:42px; background:#08111f; color:#eef5ff; border:1px solid #304766; border-radius:8px; padding:7px; }
</style>
</head>
<body>
<header>
  <h1>UAOS V1711 Owner Experimental CodeWriter Workspace</h1>
  <div>
    <span class="badge pass">stage: OWNER_EXPERIMENTAL</span>
    <span class="badge pass">writer_ready: false</span>
    <span class="badge pass">mode: __WRITER_MODE__</span>
    <span class="badge block">safe copy allowed: 0</span>
    <span class="badge pass">metadata only</span>
    <span class="badge pass">no USB / no hardware / no deploy</span>
  </div>
  <p class="small">This workspace is an owner experimental review and CodeWriter handoff. It does not copy source files, generate keyboard package files, write USB, load hardware, deploy, enable payment, or claim device compatibility.</p>
</header>

<div class="wrap">
  <section class="grid">
    <div class="card"><div class="small">Review rows</div><div class="metric" id="metricRows">0</div></div>
    <div class="card"><div class="small">Blocked metadata-only</div><div class="metric" id="metricBlocked">0</div></div>
    <div class="card"><div class="small">Safe copy allowed</div><div class="metric" id="metricSafe">0</div></div>
    <div class="card"><div class="small">Total bytes indexed</div><div class="metric" id="metricBytes">0</div></div>
  </section>

  <section class="card" style="margin-top:16px;">
    <h2>Source and output links</h2>
    <p class="small">Inventory source mode: <span class="path">__INVENTORY_SOURCE_MODE__</span></p>
    <p class="small">Inventory/source path: <span class="path">__INVENTORY_SOURCE_PATH__</span></p>
    <p class="small">Phase root: <span class="path">__PHASE_ROOT__</span></p>
    <div class="toolbar">
      <a class="btn" href="__REVIEW_QUEUE_CSV_URI__" target="_blank" rel="noreferrer">Open Review Queue CSV</a>
      <a class="btn" href="__DECISION_TEMPLATE_CSV_URI__" target="_blank" rel="noreferrer">Open Decision Template CSV</a>
      <a class="btn" href="__CODEWRITER_MISSION_URI__" target="_blank" rel="noreferrer">Open CodeWriter Mission</a>
      <a class="btn" href="__REPORT_URI__" target="_blank" rel="noreferrer">Open Report</a>
      <a class="btn" href="__SEAL_URI__" target="_blank" rel="noreferrer">Open Seal</a>
      <a class="btn" href="__PACKAGE_URI__" target="_blank" rel="noreferrer">Open Package</a>
    </div>
  </section>

  <section class="card" style="margin-top:16px;">
    <h2>Owner decision controls</h2>
    <p class="small">Decisions are browser-local until exported. Exporting creates a CSV on your machine; it does not modify source files and does not create keyboard output.</p>
    <div class="toolbar">
      <input id="searchBox" placeholder="Search path, extension, classification...">
      <select id="extFilter"><option value="">All extensions</option></select>
      <select id="classFilter"><option value="">All classifications</option></select>
      <select id="folderFilter"><option value="">All top folders</option></select>
      <select id="decisionFilter">
        <option value="">All decisions</option>
        <option value="PENDING_REVIEW">PENDING_REVIEW</option>
        <option value="KEEP_BLOCKED">KEEP_BLOCKED</option>
        <option value="DOCUMENT_ONLY">DOCUMENT_ONLY</option>
        <option value="REQUEST_SEPARATE_APPROVAL_PHASE">REQUEST_SEPARATE_APPROVAL_PHASE</option>
      </select>
      <button onclick="exportDecisions()">Export Decisions CSV</button>
      <button onclick="resetDecisions()">Reset Decisions</button>
    </div>
    <div id="validationBox"></div>
  </section>

  <section class="grid" style="margin-top:16px;">
    <div class="card"><h2>Extension summary</h2><div id="extSummary"></div></div>
    <div class="card"><h2>Classification summary</h2><div id="classSummary"></div></div>
    <div class="card"><h2>Folder summary</h2><div id="folderSummary"></div></div>
  </section>

  <section class="card" style="margin-top:16px;">
    <h2>Review queue</h2>
    <div class="tableWrap">
      <table id="reviewTable">
        <thead>
          <tr>
            <th>ID</th><th>Ext</th><th>Risk</th><th>Classification</th><th>Relative path</th>
            <th>Bytes</th><th>Blocked reason</th><th>Decision</th><th>Notes</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </section>
</div>

<footer>
  UAOS V1711 Owner Experimental CodeWriter Workspace. Metadata-only. writer_ready=false. Safe copy allowed=0.
</footer>

<script>
const rows = __ROWS_JSON__;
const extSummary = __EXT_SUMMARY_JSON__;
const classSummary = __CLASS_SUMMARY_JSON__;
const folderSummary = __FOLDER_SUMMARY_JSON__;
const expectedPriorCount = __EXPECTED_PRIOR_COUNT__;
const decisionsKey = 'UAOS_V1711_OWNER_DECISIONS';
let decisions = {};
try { decisions = JSON.parse(localStorage.getItem(decisionsKey) || '{}'); } catch(e) { decisions = {}; }

function text(v){ return String(v == null ? '' : v); }
function escapeHtml(v){ return text(v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function formatBytes(n){
  n = Number(n || 0);
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  while(n >= 1024 && i < units.length - 1){ n /= 1024; i++; }
  return (i === 0 ? String(n) : n.toFixed(2)) + ' ' + units[i];
}
function uniqueValues(field){
  const s = {};
  rows.forEach(function(r){ const v = text(r[field]); if(v) s[v] = true; });
  return Object.keys(s).sort();
}
function populateFilter(id, values){
  const el = document.getElementById(id);
  values.forEach(function(v){
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    el.appendChild(o);
  });
}
function currentDecision(id){
  return (decisions[id] && decisions[id].owner_decision) || 'PENDING_REVIEW';
}
function currentNotes(id){
  return (decisions[id] && decisions[id].owner_notes) || '';
}
function saveDecision(id, value){
  decisions[id] = decisions[id] || {};
  decisions[id].owner_decision = value;
  decisions[id].updated_at = new Date().toISOString();
  localStorage.setItem(decisionsKey, JSON.stringify(decisions));
  renderTable();
}
function saveNotes(id, value){
  decisions[id] = decisions[id] || {};
  decisions[id].owner_notes = value;
  decisions[id].updated_at = new Date().toISOString();
  localStorage.setItem(decisionsKey, JSON.stringify(decisions));
}
function optionHtml(value, selected){
  return '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
}
function decisionSelect(row){
  const id = text(row.review_id);
  const selected = currentDecision(id);
  const opts = ['PENDING_REVIEW','KEEP_BLOCKED','DOCUMENT_ONLY','REQUEST_SEPARATE_APPROVAL_PHASE'];
  let html = '<select onchange="saveDecision(\'' + escapeHtml(id) + '\', this.value)">';
  opts.forEach(function(o){ html += optionHtml(o, selected); });
  html += '</select>';
  return html;
}
function renderSummaries(){
  function table(items, labelField){
    let html = '<table style="min-width:0"><thead><tr><th>Name</th><th>Count</th><th>Blocked</th><th>Bytes</th></tr></thead><tbody>';
    items.slice(0, 30).forEach(function(x){
      const name = x[labelField] || x.name || '';
      html += '<tr><td>' + escapeHtml(name) + '</td><td>' + escapeHtml(x.count) + '</td><td>' + escapeHtml(x.blocked) + '</td><td>' + escapeHtml(formatBytes(x.total_bytes)) + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }
  document.getElementById('extSummary').innerHTML = table(extSummary, 'extension');
  document.getElementById('classSummary').innerHTML = table(classSummary, 'classification');
  document.getElementById('folderSummary').innerHTML = table(folderSummary, 'source_top_folder');
}
function filteredRows(){
  const q = text(document.getElementById('searchBox').value).toLowerCase();
  const ext = document.getElementById('extFilter').value;
  const cls = document.getElementById('classFilter').value;
  const folder = document.getElementById('folderFilter').value;
  const decision = document.getElementById('decisionFilter').value;
  return rows.filter(function(r){
    const hay = [r.review_id,r.extension,r.risk_tier,r.classification,r.relative_path,r.blocked_reason,r.source_top_folder].map(text).join(' ').toLowerCase();
    if(q && hay.indexOf(q) < 0) return false;
    if(ext && text(r.extension) !== ext) return false;
    if(cls && text(r.classification) !== cls) return false;
    if(folder && text(r.source_top_folder) !== folder) return false;
    if(decision && currentDecision(text(r.review_id)) !== decision) return false;
    return true;
  });
}
function renderTable(){
  const tbody = document.querySelector('#reviewTable tbody');
  const visible = filteredRows();
  let html = '';
  visible.forEach(function(r){
    const id = text(r.review_id);
    html += '<tr>';
    html += '<td>' + escapeHtml(id) + '</td>';
    html += '<td>' + escapeHtml(r.extension) + '</td>';
    html += '<td class="risk-' + escapeHtml(r.risk_tier) + '">' + escapeHtml(r.risk_tier) + '</td>';
    html += '<td>' + escapeHtml(r.classification) + '</td>';
    html += '<td class="path">' + escapeHtml(r.relative_path) + '</td>';
    html += '<td>' + escapeHtml(formatBytes(r.bytes)) + '</td>';
    html += '<td>' + escapeHtml(r.blocked_reason) + '</td>';
    html += '<td>' + decisionSelect(r) + '</td>';
    html += '<td><textarea onchange="saveNotes(\'' + escapeHtml(id) + '\', this.value)" onkeyup="saveNotes(\'' + escapeHtml(id) + '\', this.value)">' + escapeHtml(currentNotes(id)) + '</textarea></td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
  runBrowserValidation(visible.length);
}
function csvEscape(v){
  v = text(v);
  if(/[",\r\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}
function exportDecisions(){
  const header = ['review_id','relative_path','extension','classification','risk_tier','current_state','owner_decision','owner_notes','exported_at'];
  const lines = [header.join(',')];
  const now = new Date().toISOString();
  rows.forEach(function(r){
    const id = text(r.review_id);
    const line = [
      id, r.relative_path, r.extension, r.classification, r.risk_tier, 'BLOCKED_METADATA_ONLY',
      currentDecision(id), currentNotes(id), now
    ].map(csvEscape).join(',');
    lines.push(line);
  });
  const blob = new Blob([lines.join('\r\n') + '\r\n'], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'UAOS_V1711_OWNER_DECISIONS_' + now.replace(/[:.]/g,'-') + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function resetDecisions(){
  if(confirm('Reset browser-local owner decisions for this workspace?')){
    decisions = {};
    localStorage.removeItem(decisionsKey);
    renderTable();
  }
}
function runBrowserValidation(visibleCount){
  const total = rows.length;
  const safe = rows.filter(function(r){ return r.safe_copy_allowed === true; }).length;
  const writerReady = rows.filter(function(r){ return r.writer_ready === true; }).length;
  const pass = total > 0 && safe === 0 && writerReady === 0;
  document.getElementById('validationBox').innerHTML =
    '<span class="badge ' + (pass ? 'pass' : 'block') + '">Browser validation: ' + (pass ? 'PASS' : 'CHECK') + '</span>' +
    '<span class="badge">rows=' + total + '</span>' +
    '<span class="badge">visible=' + visibleCount + '</span>' +
    '<span class="badge">prior expected=' + expectedPriorCount + '</span>' +
    '<span class="badge">safe copy allowed=' + safe + '</span>' +
    '<span class="badge">writer_ready true=' + writerReady + '</span>';
}
function init(){
  document.getElementById('metricRows').textContent = rows.length;
  document.getElementById('metricBlocked').textContent = rows.filter(function(r){ return r.safe_copy_allowed !== true; }).length;
  document.getElementById('metricSafe').textContent = rows.filter(function(r){ return r.safe_copy_allowed === true; }).length;
  document.getElementById('metricBytes').textContent = formatBytes(rows.reduce(function(sum,r){ return sum + Number(r.bytes || 0); }, 0));
  populateFilter('extFilter', uniqueValues('extension'));
  populateFilter('classFilter', uniqueValues('classification'));
  populateFilter('folderFilter', uniqueValues('source_top_folder'));
  ['searchBox','extFilter','classFilter','folderFilter','decisionFilter'].forEach(function(id){
    document.getElementById(id).addEventListener('input', renderTable);
    document.getElementById(id).addEventListener('change', renderTable);
  });
  renderSummaries();
  renderTable();
}
init();
</script>
</body>
</html>
'@

$replaceMap = [ordered]@{
    "__WRITER_MODE__" = (HtmlEncode-Uaos $AllowedWriterMode)
    "__INVENTORY_SOURCE_MODE__" = (HtmlEncode-Uaos $InventorySourceMode)
    "__INVENTORY_SOURCE_PATH__" = (HtmlEncode-Uaos $InventorySourcePath)
    "__PHASE_ROOT__" = (HtmlEncode-Uaos $PhaseRoot)
    "__REVIEW_QUEUE_CSV_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $ReviewQueueCsv))
    "__DECISION_TEMPLATE_CSV_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $DecisionTemplateCsv))
    "__CODEWRITER_MISSION_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $CodeWriterMissionMd))
    "__REPORT_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $ReportMd))
    "__SEAL_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $SealMd))
    "__PACKAGE_URI__" = (HtmlEncode-Uaos (Get-UaosFileUri -Path $PackageZip))
    "__ROWS_JSON__" = $RowsJsonForHtml
    "__EXT_SUMMARY_JSON__" = $ExtSummaryJsonForHtml
    "__CLASS_SUMMARY_JSON__" = $ClassSummaryJsonForHtml
    "__FOLDER_SUMMARY_JSON__" = $FolderSummaryJsonForHtml
    "__EXPECTED_PRIOR_COUNT__" = [string]$ExpectedPriorCount
}

$html = $WorkspaceTemplate
foreach ($key in $replaceMap.Keys) {
    $html = $html.Replace($key, [string]$replaceMap[$key])
}
$html | Set-Content -Path $WorkspaceHtml -Encoding UTF8

# -----------------------------
# CodeWriter mission and handoff
# -----------------------------
Write-UaosStep "Writing CodeWriter owner experimental handoff"

$CodeWriterPatchPlan = [pscustomobject][ordered]@{
    phase = "UAOS V1711"
    mission = "Owner Experimental CodeWriter"
    mode = $AllowedWriterMode
    allowed_role = "Senior Engineer only, not unattended 24h agent"
    allowed_writes = @(
        "uaos-ai-factory/RUN_UAOS_V1711_OWNER_EXPERIMENTAL_CODEWRITER_MEGALAUNCHER.ps1",
        "uaos-ai-factory/$PhaseName/**",
        "docs/UAOS_OWNER_EXPERIMENTAL_STAGE.md"
    )
    forbidden_actions = @(
        "Do not copy source keyboard files",
        "Do not create .SET/.PCM/.STY/.PRF/.PCG/.PAD/.KMP/.KSF/.SBD/.SBL/.GBL/.VOC/.MXP/.BKP keyboard outputs",
        "Do not enable writer_ready true",
        "Do not write USB",
        "Do not load hardware",
        "Do not deploy",
        "Do not enable payment",
        "Do not claim KORG/PA3X compatibility as production-ready",
        "Do not scan whole repo unnecessarily",
        "Do not run open-ended loops"
    )
    acceptance_gates = @(
        "PowerShell completes with exit code 0",
        "review rows > 0",
        "safe_copy_allowed_count == 0",
        "writer_ready == false",
        "forbidden_generated_files_count == 0",
        "workspace/report/seal/package exist",
        "CodeWriter mission exists",
        "owner decision CSV template exists"
    )
    current_break_fix = @(
        "Normalize JSON root and row arrays before counting",
        "Never depend on root.Count in JSON inventory objects",
        "Use explicit foreach loops for option/summary generation instead of fragile ForEach-Object pipelines"
    )
}
(ConvertTo-UaosSafeJson -InputObject $CodeWriterPatchPlan) | Set-Content -Path $CodeWriterPatchPlanJson -Encoding UTF8

$CodeWriterMission = @"
# UAOS V1711 CodeWriter Mission - Owner Experimental

## Executive instruction

Continue UAOS as **MegaLauncher, one script**.

Use this file as the CodeWriter mission for the next local senior-engineer pass. The current script has already moved the project into the owner experimental workspace path:

`$PhaseRoot`

## Stage

- Stage: OWNER_EXPERIMENTAL_CODEWRITER
- Writer mode: $AllowedWriterMode
- writer_ready: false
- Safe copy allowed: 0
- Source file copy: NO
- Real keyboard binary writer: NO
- Keyboard package output: NO
- USB write: NO
- Hardware load: NO
- Deploy/payment: NO

## Fix applied by this launcher

The failed V1708/V1710 run broke because the previous script assumed a fixed JSON shape and used fragile PowerShell pipeline generation around extension summaries.

This V1711 launcher fixes that by:

1. Loading JSON inventory through a loose parser.
2. Extracting rows from common keys like rows/files/items/blocked_files/inventory.
3. Falling back to direct metadata scan when the JSON inventory is absent or malformed.
4. Counting collections through normalized arrays, not through a required JSON `.Count` property.
5. Building owner option/summary sections through explicit `foreach` loops.

## CodeWriter allowed edits

- Keep all generated files inside `uaos-ai-factory/$PhaseName`.
- The only root-level allowed project doc is `docs/UAOS_OWNER_EXPERIMENTAL_STAGE.md`.
- Keep the MegaLauncher script as the single entry point:
  `uaos-ai-factory/$ScriptFileName`

## CodeWriter forbidden edits

- Do not copy, transform, decode, export, or regenerate proprietary keyboard files.
- Do not create any forbidden keyboard extension output.
- Do not switch `writer_ready` to true.
- Do not write USB.
- Do not load hardware.
- Do not deploy.
- Do not enable payment.
- Do not make production compatibility claims.

## Acceptance

The owner experimental handoff is acceptable when:

- `UAOS_V1711_VALIDATION.json` reports `OWNER_EXPERIMENTAL_READY`.
- `UAOS_V1711_OWNER_EXPERIMENTAL_WORKSPACE.html` opens locally.
- Owner decisions can be exported as CSV.
- `UAOS_V1711_FINAL_OWNER_EXPERIMENTAL_SEAL.md` exists.
- The package zip exists and has a SHA256 hash.

"@
$CodeWriterMission | Set-Content -Path $CodeWriterMissionMd -Encoding UTF8

$CodeWriterHandoff = @"
# UAOS V1711 CodeWriter Handoff

Run:

````powershell
powershell -ExecutionPolicy Bypass -File "$FactoryScriptPath"
````

Optional no-open/no-commit run:

````powershell
powershell -ExecutionPolicy Bypass -File "$FactoryScriptPath" -NoOpen -NoGitCommit
````

Primary owner file:

`$WorkspaceHtml`

Primary validation:

`$ValidationJson`

Primary package:

`$PackageZip`

"@
$CodeWriterHandoff | Set-Content -Path $CodeWriterHandoffMd -Encoding UTF8

# Project-level stage doc, generated by MegaLauncher.
$DocsDir = Join-Path $RepoRoot "docs"
try {
    New-UaosDirectory -Path $DocsDir
    $StageDoc = Join-Path $DocsDir "UAOS_OWNER_EXPERIMENTAL_STAGE.md"
    $StageDocText = @"
# UAOS Owner Experimental Stage

Generated by: $ScriptFileName  
Created: $((Get-Date).ToString("s"))

## Current status

UAOS has a local owner experimental metadata-only workspace.

- Phase: UAOS V1711
- Stage: OWNER_EXPERIMENTAL_CODEWRITER
- Review rows: $TotalRows
- Blocked metadata-only rows: $BlockedCount
- Safe copy allowed: $SafeCopyAllowedCount
- writer_ready: false
- Writer mode: $AllowedWriterMode

## Safety

No source files are copied. No keyboard package files are generated. No USB write, hardware load, deploy, payment, or production compatibility claim is enabled.

## Owner files

- Workspace: `$WorkspaceHtml`
- Review CSV: `$ReviewQueueCsv`
- Decision template: `$DecisionTemplateCsv`
- Report: `$ReportMd`
- Seal: `$SealMd`
- CodeWriter mission: `$CodeWriterMissionMd`
- Package: `$PackageZip`

"@
    $StageDocText | Set-Content -Path $StageDoc -Encoding UTF8
    Write-UaosOk ("Project owner experimental doc written: " + $StageDoc)
} catch {
    Write-UaosWarn ("Could not write project stage doc: " + $_.Exception.Message)
}

# -----------------------------
# Integration block
# -----------------------------
$IntegrationContent = @"
<!-- UAOS V1711 Owner Experimental CodeWriter Link Block - metadata-only -->
<section class="uaos-card uaos-v1711-owner-experimental">
  <h2>UAOS V1711 Owner Experimental CodeWriter</h2>
  <p>Metadata-only owner experimental workspace. writer_ready remains false. Safe copy allowed = 0. No keyboard package writer, no USB write, no hardware load, no deploy, no payment.</p>
  <a href="$(HtmlEncode-Uaos (Get-UaosFileUri -Path $WorkspaceHtml))" target="_blank" rel="noreferrer">Open V1711 Owner Experimental Workspace</a>
  <a href="$(HtmlEncode-Uaos (Get-UaosFileUri -Path $ReviewQueueCsv))" target="_blank" rel="noreferrer">Open Review Queue CSV</a>
  <a href="$(HtmlEncode-Uaos (Get-UaosFileUri -Path $DecisionTemplateCsv))" target="_blank" rel="noreferrer">Open Owner Decision Template</a>
  <a href="$(HtmlEncode-Uaos (Get-UaosFileUri -Path $CodeWriterMissionMd))" target="_blank" rel="noreferrer">Open CodeWriter Mission</a>
</section>
"@
$IntegrationContent | Set-Content -Path $IntegrationHtml -Encoding UTF8

# -----------------------------
# Validation/report/seal
# -----------------------------
Write-UaosStep "Running final validation"
$GeneratedForbiddenFiles = @(Test-UaosNoForbiddenGeneratedFiles -Root $PhaseRoot)
$GeneratedForbiddenCount = [int](Get-UaosCollectionCount -Value $GeneratedForbiddenFiles)

$RowsPass = ($TotalRows -gt 0)
$SafePass = ($SafeCopyAllowedCount -eq 0)
$WriterPass = ($WriterReadyTrueCount -eq 0)
$WorkspacePass = (Test-Path -LiteralPath $WorkspaceHtml)
$DataPass = ((Test-Path -LiteralPath $ReviewQueueJson) -and (Test-Path -LiteralPath $ReviewQueueCsv) -and (Test-Path -LiteralPath $DecisionTemplateCsv))
$CodeWriterPass = ((Test-Path -LiteralPath $CodeWriterMissionMd) -and (Test-Path -LiteralPath $CodeWriterPatchPlanJson))
$NoForbiddenGeneratedPass = ($GeneratedForbiddenCount -eq 0)
$PriorCountMatch = ($TotalRows -eq $ExpectedPriorCount)
$OverallPass = ($RowsPass -and $SafePass -and $WriterPass -and $WorkspacePass -and $DataPass -and $CodeWriterPass -and $NoForbiddenGeneratedPass)

$Validation = [pscustomobject][ordered]@{
    phase = "UAOS V1711"
    stage = "OWNER_EXPERIMENTAL_CODEWRITER"
    status = if ($OverallPass) { "OWNER_EXPERIMENTAL_READY" } else { "CHECK" }
    created_at = (Get-Date).ToString("s")
    inventory_source_mode = $InventorySourceMode
    inventory_source_path = $InventorySourcePath
    expected_prior_count = $ExpectedPriorCount
    actual_file_count = $TotalRows
    prior_count_match = $PriorCountMatch
    rows_pass = $RowsPass
    safe_copy_allowed_count = $SafeCopyAllowedCount
    safe_pass = $SafePass
    blocked_metadata_only_count = $BlockedCount
    writer_ready = $false
    writer_ready_true_rows = $WriterReadyTrueCount
    writer_pass = $WriterPass
    writer_mode = $AllowedWriterMode
    real_keyboard_binary_writer = "NO"
    keyboard_package_output_generated = "NO"
    forbidden_keyboard_extensions_generated = "NO"
    forbidden_keyboard_extensions_copied = "NO"
    source_files_copied = "NO"
    usb_write = "NO"
    hardware_load = "NO"
    deploy = "NO"
    payment = "NO"
    compatibility_claims = "NO"
    package = $PackageZip
    package_sha256 = ""
    package_pass = $false
    generated_forbidden_files_count = $GeneratedForbiddenCount
    generated_forbidden_files = $GeneratedForbiddenFiles
    no_forbidden_generated_pass = $NoForbiddenGeneratedPass
    workspace_pass = $WorkspacePass
    data_pass = $DataPass
    codewriter_pass = $CodeWriterPass
    overall_pass = $OverallPass
    workspace = $WorkspaceHtml
    review_queue_csv = $ReviewQueueCsv
    decision_template_csv = $DecisionTemplateCsv
    report = $ReportMd
    seal = $SealMd
    codewriter_mission = $CodeWriterMissionMd
}
(ConvertTo-UaosSafeJson -InputObject $Validation) | Set-Content -Path $ValidationJson -Encoding UTF8

$Report = @"
# UAOS V1711 Owner Experimental CodeWriter Report

Created: $((Get-Date).ToString("s"))

## Executive status

Status: **$(if ($OverallPass) { "OWNER_EXPERIMENTAL_READY" } else { "CHECK" })**

The project has been advanced to a local owner experimental metadata-only stage through a single MegaLauncher script.

## Inventory

- Source mode: $InventorySourceMode
- Source path: `$InventorySourcePath`
- Review rows: $TotalRows
- Prior expected count: $ExpectedPriorCount
- Prior count match: $PriorCountMatch
- Total bytes indexed: $TotalBytes
- Blocked metadata-only: $BlockedCount
- Safe copy allowed: $SafeCopyAllowedCount

## Current error fix

The V1708/V1710 crash is addressed by:

- No required `.Count` property on JSON root objects.
- Array normalization before counting.
- Loose inventory row extraction from multiple possible JSON shapes.
- Direct metadata scan fallback.
- Explicit `foreach` loops for summary and option generation.

## Safety locks

- writer_ready: false
- writer_mode: $AllowedWriterMode
- real keyboard binary writer: NO
- keyboard package output generated: NO
- forbidden keyboard extensions generated: NO
- forbidden keyboard extensions copied: NO
- source files copied: NO
- USB write: NO
- hardware load: NO
- deploy: NO
- payment: NO
- compatibility claims: NO

## Owner outputs

- Workspace: `$WorkspaceHtml`
- Review queue JSON: `$ReviewQueueJson`
- Review queue CSV: `$ReviewQueueCsv`
- Owner decision template CSV: `$DecisionTemplateCsv`
- Extension summary CSV: `$ExtensionSummaryCsv`
- Classification summary CSV: `$ClassificationSummaryCsv`
- Folder summary CSV: `$FolderSummaryCsv`
- CodeWriter mission: `$CodeWriterMissionMd`
- CodeWriter patch plan: `$CodeWriterPatchPlanJson`
- Integration block: `$IntegrationHtml`
- Validation: `$ValidationJson`
- Seal: `$SealMd`

## Validation

- Rows pass: $RowsPass
- Safe copy pass: $SafePass
- Writer pass: $WriterPass
- Workspace pass: $WorkspacePass
- Data pass: $DataPass
- CodeWriter pass: $CodeWriterPass
- No forbidden generated files: $NoForbiddenGeneratedPass
- Overall: $OverallPass

"@
$Report | Set-Content -Path $ReportMd -Encoding UTF8

$Seal = @"
# UAOS V1711 Final Owner Experimental Seal

Seal status: **$(if ($OverallPass) { "SEALED_OWNER_EXPERIMENTAL_READY" } else { "SEALED_CHECK" })**

This seal confirms that UAOS V1711 is an owner experimental metadata-only handoff.

- writer_ready remains false.
- writer_mode is $AllowedWriterMode.
- No real keyboard binary writer is enabled.
- No keyboard package output is generated.
- No forbidden keyboard extensions are generated or copied.
- No source files are copied.
- No USB write occurs.
- No hardware load occurs.
- No deploy occurs.
- No payment flow is enabled.
- No compatibility or keyboard-ready production claim is made.

The only allowed outputs are review metadata, HTML workspace, CSV/JSON summaries, CodeWriter handoff, validation, report, seal, integration link block, logs, and package archive.

Created: $((Get-Date).ToString("s"))
"@
$Seal | Set-Content -Path $SealMd -Encoding UTF8

$Manifest = [pscustomobject][ordered]@{
    phase = "UAOS V1711"
    stage = "OWNER_EXPERIMENTAL_CODEWRITER"
    status = if ($OverallPass) { "OWNER_EXPERIMENTAL_READY" } else { "CHECK" }
    created_at = (Get-Date).ToString("s")
    phase_root = $PhaseRoot
    files = [ordered]@{
        launcher = $FactoryScriptPath
        workspace = $WorkspaceHtml
        review_queue_json = $ReviewQueueJson
        review_queue_csv = $ReviewQueueCsv
        decision_template_csv = $DecisionTemplateCsv
        extension_summary_csv = $ExtensionSummaryCsv
        classification_summary_csv = $ClassificationSummaryCsv
        folder_summary_csv = $FolderSummaryCsv
        safety_ledger_json = $SafetyLedgerJson
        codewriter_mission_md = $CodeWriterMissionMd
        codewriter_patch_plan_json = $CodeWriterPatchPlanJson
        codewriter_handoff_md = $CodeWriterHandoffMd
        integration_html = $IntegrationHtml
        validation_json = $ValidationJson
        report_md = $ReportMd
        seal_md = $SealMd
        package_zip = $PackageZip
        run_log = $RunLog
    }
}
(ConvertTo-UaosSafeJson -InputObject $Manifest) | Set-Content -Path $ManifestJson -Encoding UTF8

# -----------------------------
# Package
# -----------------------------
Write-UaosStep "Packaging owner experimental outputs"
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("uaos_v1711_owner_experimental_" + [guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-UaosDirectory -Path $staging

foreach ($sourceDir in @($DataDir, $WorkspaceDir, $ReportsDir, $ValidationDir, $SealDir, $IntegrationDir, $LogsDir, $CodeWriterDir)) {
    Copy-UaosDirectoryToStage -Source $sourceDir -DestinationRoot $staging
}
if (Test-Path -LiteralPath $FactoryScriptPath) {
    Copy-Item -LiteralPath $FactoryScriptPath -Destination (Join-Path $staging $ScriptFileName) -Force
}

if (Test-Path -LiteralPath $PackageZip) {
    Remove-Item -LiteralPath $PackageZip -Force
}
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $PackageZip -Force
Remove-Item -LiteralPath $staging -Recurse -Force

$PackagePass = ((Test-Path -LiteralPath $PackageZip) -and ((Get-Item -LiteralPath $PackageZip).Length -gt 0))
$PackageHash = Get-UaosSha256 -Path $PackageZip
if ($PackagePass) {
    Write-UaosOk ("Package created: " + $PackageZip)
    Write-UaosOk ("Package SHA256: " + $PackageHash)
} else {
    Write-UaosFail ("Package creation failed: " + $PackageZip)
}

# Refresh validation/report package hash after package creation.
$Validation.package = $PackageZip
$Validation.package_sha256 = $PackageHash
$Validation.package_pass = $PackagePass
$Validation.overall_pass = ($OverallPass -and $PackagePass)
$Validation.status = if ($Validation.overall_pass) { "OWNER_EXPERIMENTAL_READY" } else { "CHECK" }
(ConvertTo-UaosSafeJson -InputObject $Validation) | Set-Content -Path $ValidationJson -Encoding UTF8

# -----------------------------
# Optional git commit, no push
# -----------------------------
Write-UaosStep "Optional git commit"
$GitStatus = "SKIPPED"
$GitHash = ""
if (!$NoGitCommit) {
    try {
        $gitCmd = Get-Command git -ErrorAction SilentlyContinue
        if ($null -ne $gitCmd -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
            Push-Location $RepoRoot
            try {
                $pathsToAdd = @(
                    "uaos-ai-factory/$ScriptFileName",
                    "uaos-ai-factory/$PhaseName",
                    "docs/UAOS_OWNER_EXPERIMENTAL_STAGE.md"
                )
                & git add -- $pathsToAdd | Out-Null
                $statusPorcelain = (& git status --porcelain)
                $statusText = ($statusPorcelain | Out-String)
                if ([string]::IsNullOrWhiteSpace($statusText)) {
                    $GitStatus = "NO_CHANGES"
                } else {
                    & git commit -m "UAOS V1711 owner experimental CodeWriter handoff" | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $GitHash = (& git rev-parse --short HEAD).Trim()
                        $GitStatus = "COMMITTED"
                    } else {
                        $GitStatus = "COMMIT_FAILED"
                    }
                }
            } finally {
                Pop-Location
            }
        } else {
            $GitStatus = "GIT_NOT_AVAILABLE_OR_NOT_REPO"
        }
    } catch {
        $GitStatus = "COMMIT_FAILED: " + $_.Exception.Message
        Write-UaosWarn $GitStatus
    }
} else {
    $GitStatus = "SKIPPED_BY_FLAG"
}

# Final summary log
$FinalSummary = [pscustomobject][ordered]@{
    phase = "UAOS V1711"
    stage = "OWNER_EXPERIMENTAL_CODEWRITER"
    status = $Validation.status
    workspace = $WorkspaceHtml
    review_queue_csv = $ReviewQueueCsv
    decision_template_csv = $DecisionTemplateCsv
    codewriter_mission = $CodeWriterMissionMd
    validation = $ValidationJson
    report = $ReportMd
    seal = $SealMd
    package = $PackageZip
    package_sha256 = $PackageHash
    git_status = $GitStatus
    git_hash = $GitHash
    writer_ready = $false
    safe_copy_allowed = 0
    rows = $TotalRows
    blocked = $BlockedCount
    inventory_source_mode = $InventorySourceMode
    inventory_source_path = $InventorySourcePath
}
(ConvertTo-UaosSafeJson -InputObject $FinalSummary) | Add-Content -Path $RunLog -Encoding UTF8

Write-Host ""
Write-UaosOk "UAOS V1711 Owner Experimental CodeWriter MegaLauncher complete"
Write-Host ("Status: " + $Validation.status) -ForegroundColor Green
Write-Host ("Workspace: " + $WorkspaceHtml)
Write-Host ("Review queue CSV: " + $ReviewQueueCsv)
Write-Host ("Decision template CSV: " + $DecisionTemplateCsv)
Write-Host ("CodeWriter mission: " + $CodeWriterMissionMd)
Write-Host ("Validation: " + $ValidationJson)
Write-Host ("Report: " + $ReportMd)
Write-Host ("Seal: " + $SealMd)
Write-Host ("Package: " + $PackageZip)
Write-Host ("Package SHA256: " + $PackageHash)
Write-Host ("Git: " + $GitStatus + $(if ($GitHash) { " " + $GitHash } else { "" }))
Write-Host "writer_ready remains false. No source files copied. No keyboard output generated."

if (!$NoOpen -and (Test-Path -LiteralPath $WorkspaceHtml)) {
    Start-Process $WorkspaceHtml
}

if ($Validation.status -ne "OWNER_EXPERIMENTAL_READY") {
    exit 2
}
exit 0


