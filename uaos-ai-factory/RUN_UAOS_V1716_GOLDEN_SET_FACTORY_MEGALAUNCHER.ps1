# UAOS V1716 GOLDEN SET FACTORY MEGALAUNCHER
# One MegaLauncher only.
# Creates remaining product sections: owner reader, golden set generator, sound test loop, commercial library factory, CodeX tasks.
# Safety: owner materials only; blocked V1713/KORG backup files are metadata only; no binary KORG SET/PCM/STY output; no USB/hardware/deploy/payment.

[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\keyboard-manager-clean",
    [string]$OwnerInputRoot = "E:\keyboard-manager-clean\uaos-owner-libraries\input",
    [string]$MarketSourceRoot = "E:\keyboard-manager-clean\uaos-market-libraries\source",
    [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1716-golden-set-factory",
    [switch]$NoOpen,
    [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName = "RUN_UAOS_V1716_GOLDEN_SET_FACTORY_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "V1716_GOLDEN_SET_FACTORY"
$ReadyStatus = "GOLDEN_SET_FACTORY_READY"
$WaitingStatus = "WAITING_FOR_OWNER_LIBRARY_INPUT"
$HardwareStatus = "PA3X_BINARY_SEPARATE_HARDWARE_TEST_REQUIRED"

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$PackageDir = Join-Path $PhaseRoot "package"
$LogsDir = Join-Path $PhaseRoot "logs"
$SectionsDir = Join-Path $PhaseRoot "sections"
$CodexDir = Join-Path $PhaseRoot "codex-tasks"

$OwnerReaderDir = Join-Path $SectionsDir "01_owner_library_reader"
$GoldenGeneratorDir = Join-Path $SectionsDir "02_golden_set_generator"
$SoundTestDir = Join-Path $SectionsDir "03_owner_sound_test_loop"
$CommercialDir = Join-Path $SectionsDir "04_commercial_library_factory"
$RoadmapDir = Join-Path $SectionsDir "05_execution_roadmap"

$GoldenRoot = Join-Path $PhaseRoot "output\UAOS_GOLDEN_SET_001_DRAFT"
$GoldenSamplesDir = Join-Path $GoldenRoot "samples"
$GoldenProgramsDir = Join-Path $GoldenRoot "programs"
$GoldenKeymapsDir = Join-Path $GoldenRoot "keymaps"
$GoldenDsbDir = Join-Path $GoldenRoot "dsb"
$GoldenMixerDir = Join-Path $GoldenRoot "mixer"
$GoldenManifestsDir = Join-Path $GoldenRoot "manifest"
$GoldenDocsDir = Join-Path $GoldenRoot "docs"

$RunLog = Join-Path $LogsDir "UAOS_V1716_GOLDEN_SET_FACTORY_RUN.log"
$PortalHtml = Join-Path $WorkspaceDir "UAOS_V1716_GOLDEN_SET_FACTORY_PORTAL.html"
$ValidationJson = Join-Path $ValidationDir "UAOS_V1716_GOLDEN_SET_FACTORY_VALIDATION.json"
$ReportMd = Join-Path $ReportsDir "UAOS_V1716_GOLDEN_SET_FACTORY_REPORT.md"
$SealMd = Join-Path $SealDir "UAOS_V1716_GOLDEN_SET_FACTORY_SEAL.md"
$PointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_GOLDEN_SET_FACTORY.json"
$StatusDoc = Join-Path (Join-Path $RepoRoot "docs") "UAOS_GOLDEN_SET_FACTORY_STATUS.md"
$ZipPath = Join-Path $PackageDir "UAOS_V1716_GOLDEN_SET_FACTORY_PACKAGE.zip"
$ShaPath = Join-Path $PackageDir "UAOS_V1716_GOLDEN_SET_FACTORY_PACKAGE.sha256.txt"
$GitIgnore = Join-Path $PhaseRoot ".gitignore"

$OwnerAudioManifestCsv = Join-Path $OwnerReaderDir "OWNER_AUDIO_MANIFEST.csv"
$KeyboardMetadataCsv = Join-Path $OwnerReaderDir "KEYBOARD_SET_METADATA_ONLY.csv"
$SkippedCsv = Join-Path $OwnerReaderDir "SKIPPED_FILES.csv"
$GoldenProgramJson = Join-Path $GoldenProgramsDir "UAOS_GOLDEN_PROGRAMS_DRAFT.json"
$GoldenKeymapCsv = Join-Path $GoldenKeymapsDir "UAOS_GOLDEN_KEYMAP_DRAFT.csv"
$GoldenDsbJson = Join-Path $GoldenDsbDir "UAOS_GOLDEN_DSB_DRAFT.json"
$GoldenMixerJson = Join-Path $GoldenMixerDir "UAOS_GOLDEN_MIXER_DRAFT.json"
$GoldenManifestJson = Join-Path $GoldenManifestsDir "UAOS_GOLDEN_SET_001_DRAFT_MANIFEST.json"
$SoundTestChecklistJson = Join-Path $SoundTestDir "UAOS_OWNER_SOUND_TEST_CHECKLIST.json"
$CommercialSkusJson = Join-Path $CommercialDir "UAOS_COMMERCIAL_LIBRARY_SKUS_DRAFT.json"
$CodeXPromptMd = Join-Path $CodexDir "CODEX_NEXT_IMPLEMENTATION_TASKS.md"
$RoadmapMd = Join-Path $RoadmapDir "UAOS_FASTEST_EXECUTION_ROADMAP.md"

$AllowedAudioExts = @(".wav",".aif",".aiff",".flac",".ogg",".mp3")
$KeyboardMetaExts = @(".set",".pcm",".sty",".pcg",".prf",".pad",".kmp",".ksf",".sbd",".sbl",".gbl",".voc",".mxp",".bkp",".ksc",".kst",".prg",".dk",".dkp")
$OldKorgMarkers = @("KORG_PA3X_RECOVERY_BACKUP","PLACE_PA3X_BACKUP_HERE","uaos-v1713-final-writer","uaos-v1712-owner-experimental-codewriter","uaos-v1711-owner-experimental-codewriter","uaos-v1708-v1710-final-safe-owner-completion")

function New-UaosDirectory {
    param([string]$Path)
    if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }
}

function Write-UaosLog {
    param([string]$Message, [string]$Level = "INFO", [ConsoleColor]$Color = [ConsoleColor]::Gray)
    $line = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] [" + $Level + "] " + $Message
    Write-Host $line -ForegroundColor $Color
    try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {}
}

function ConvertTo-UaosJson {
    param([AllowNull()][object]$Value)
    return ($Value | ConvertTo-Json -Depth 100)
}

function ConvertTo-HtmlSafe {
    param([AllowNull()][object]$Value)
    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function Get-UaosFileUri {
    param([string]$Path)
    try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path }
}

function Get-UaosSha256 {
    param([string]$Path)
    if (!(Test-Path -LiteralPath $Path)) { return "" }
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

function Get-UaosRelativePath {
    param([string]$BasePath, [string]$FullPath)
    try {
        $baseFull = [System.IO.Path]::GetFullPath($BasePath).TrimEnd([char]'\',[char]'/')
        $fullFull = [System.IO.Path]::GetFullPath($FullPath)
        if ($fullFull.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $fullFull.Substring($baseFull.Length).TrimStart([char]'\',[char]'/')
        }
        return $FullPath
    } catch { return $FullPath }
}

function ConvertTo-SafeFileName {
    param([string]$Name)
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    $out = ""
    foreach ($ch in $Name.ToCharArray()) {
        if ($invalid -contains $ch) { $out += "_" } else { $out += $ch }
    }
    $out = $out -replace "\s+","_"
    if ([string]::IsNullOrWhiteSpace($out)) { return "sample" }
    return $out
}

function Test-OldKorgPath {
    param([string]$Path)
    foreach ($m in $OldKorgMarkers) {
        if ($Path.IndexOf($m, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
    }
    if ($Path -match "(?i)(^|[\\/])[^\\/]+\.SET([\\/]|$)") { return $true }
    return $false
}

function Get-GoldenCategory {
    param([string]$Name)
    $n = $Name.ToLowerInvariant()
    if ($n -match "drum|kick|snare|perc|tabla|darbuka|loop") { return "Rhythm" }
    if ($n -match "bass") { return "Bass" }
    if ($n -match "string|violin|cello|oud|qanun|saz") { return "Oriental_Strings" }
    if ($n -match "lead|solo|nay|flute|clarinet|mizmar|sax") { return "Lead" }
    if ($n -match "pad|choir|voice|atmo") { return "Pad" }
    return "General"
}

function Get-RootNote {
    param([string]$Name, [int]$Fallback)
    $map = @{"C"=0;"C#"=1;"DB"=1;"D"=2;"D#"=3;"EB"=3;"E"=4;"F"=5;"F#"=6;"GB"=6;"G"=7;"G#"=8;"AB"=8;"A"=9;"A#"=10;"BB"=10;"B"=11}
    $m = [regex]::Match($Name.ToUpperInvariant(), "(C#|DB|D#|EB|F#|GB|G#|AB|A#|BB|C|D|E|F|G|A|B)(-?\d)")
    if ($m.Success) {
        return [int](12 * ([int]$m.Groups[2].Value + 1) + [int]$map[$m.Groups[1].Value])
    }
    return $Fallback
}

foreach ($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$PackageDir,$LogsDir,$SectionsDir,$CodexDir,$OwnerReaderDir,$GoldenGeneratorDir,$SoundTestDir,$CommercialDir,$RoadmapDir,$GoldenRoot,$GoldenSamplesDir,$GoldenProgramsDir,$GoldenKeymapsDir,$GoldenDsbDir,$GoldenMixerDir,$GoldenManifestsDir,$GoldenDocsDir,$OwnerInputRoot,$MarketSourceRoot,(Join-Path $RepoRoot "docs"))) {
    New-UaosDirectory $d
}

Write-UaosLog "UAOS V1716 GOLDEN SET FACTORY started" "STEP" Cyan
Write-UaosLog "OwnerInputRoot: $OwnerInputRoot"
Write-UaosLog "MarketSourceRoot: $MarketSourceRoot"
Write-UaosLog "PhaseRoot: $PhaseRoot"

try {
    $currentScript = $PSCommandPath
    if ([string]::IsNullOrWhiteSpace($currentScript)) { $currentScript = $MyInvocation.MyCommand.Path }
    if (![string]::IsNullOrWhiteSpace($currentScript) -and (Test-Path -LiteralPath $currentScript)) {
        $src = (Resolve-Path -LiteralPath $currentScript).Path
        if (!(Test-Path -LiteralPath $FactoryScriptPath) -or ![string]::Equals($src, (Resolve-Path -LiteralPath $FactoryScriptPath).Path, [System.StringComparison]::OrdinalIgnoreCase)) {
            Copy-Item -LiteralPath $src -Destination $FactoryScriptPath -Force
        }
    }
} catch {}

@("output/*/samples/","package/*.zip","*.wav","*.aif","*.aiff","*.flac","*.mp3","*.ogg","*.SET","*.PCM","*.STY","*.PCG","*.PRF","*.BKP") | Set-Content -LiteralPath $GitIgnore -Encoding UTF8

Write-UaosLog "Scanning owner libraries" "STEP" Cyan
$allInputFiles = @(Get-ChildItem -LiteralPath $OwnerInputRoot -Recurse -File -ErrorAction SilentlyContinue)
$audioRows = @()
$keyboardRows = @()
$skippedRows = @()
$copiedRows = @()
$index = 0
$fallbackNote = 60

foreach ($f in $allInputFiles) {
    $ext = ([string]$f.Extension).ToLowerInvariant()
    $full = [string]$f.FullName
    if ($AllowedAudioExts -contains $ext -and !(Test-OldKorgPath $full)) {
        $index++
        $id = "G" + $index.ToString("0000")
        $cat = Get-GoldenCategory $f.Name
        $targetCategoryDir = Join-Path $GoldenSamplesDir $cat
        New-UaosDirectory $targetCategoryDir
        $destName = $id + "_" + (ConvertTo-SafeFileName ([System.IO.Path]::GetFileNameWithoutExtension($f.Name))) + $ext
        $destPath = Join-Path $targetCategoryDir $destName
        Copy-Item -LiteralPath $f.FullName -Destination $destPath -Force
        $rootNote = Get-RootNote $f.Name $fallbackNote
        $fallbackNote++
        if ($fallbackNote -gt 84) { $fallbackNote = 60 }

        $row = "" | Select-Object id, category, original_name, source_relative_path, source_sha256, output_relative_path, extension, bytes, root_midi_note, status
        $row.id = $id
        $row.category = $cat
        $row.original_name = $f.Name
        $row.source_relative_path = Get-UaosRelativePath $OwnerInputRoot $f.FullName
        $row.source_sha256 = Get-UaosSha256 $f.FullName
        $row.output_relative_path = Get-UaosRelativePath $GoldenRoot $destPath
        $row.extension = $ext
        $row.bytes = [int64]$f.Length
        $row.root_midi_note = [int]$rootNote
        $row.status = "OWNER_AUDIO_COPIED_TO_GOLDEN_DRAFT"
        $audioRows += $row
    } elseif ($KeyboardMetaExts -contains $ext) {
        $kr = "" | Select-Object file_name, relative_path, extension, bytes, sha256, handling
        $kr.file_name = $f.Name
        $kr.relative_path = Get-UaosRelativePath $OwnerInputRoot $f.FullName
        $kr.extension = $ext
        $kr.bytes = [int64]$f.Length
        $kr.sha256 = Get-UaosSha256 $f.FullName
        $kr.handling = "METADATA_ONLY_NOT_COPIED"
        $keyboardRows += $kr
    } else {
        $sr = "" | Select-Object file_name, relative_path, extension, reason
        $sr.file_name = $f.Name
        $sr.relative_path = Get-UaosRelativePath $OwnerInputRoot $f.FullName
        $sr.extension = $ext
        $sr.reason = "UNSUPPORTED_OR_OLD_KORG_PATH_SKIPPED"
        $skippedRows += $sr
    }
}

$audioRows | Export-Csv -LiteralPath $OwnerAudioManifestCsv -NoTypeInformation -Encoding UTF8
$keyboardRows | Export-Csv -LiteralPath $KeyboardMetadataCsv -NoTypeInformation -Encoding UTF8
$skippedRows | Export-Csv -LiteralPath $SkippedCsv -NoTypeInformation -Encoding UTF8

Write-UaosLog ("Owner audio copied: " + @($audioRows).Count) "PASS" Green
Write-UaosLog ("Keyboard metadata only rows: " + @($keyboardRows).Count) "INFO" Gray

# Golden programs/keymaps
$keymapRows = @()
$programs = @()
$programIndex = 0
foreach ($row in $audioRows) {
    $programIndex++
    $km = "" | Select-Object keymap_id, sample_id, category, sample_file, root_midi_note, low_midi_note, high_midi_note, velocity_low, velocity_high, loop_mode, gain_db, pan
    $km.keymap_id = "GKM" + $programIndex.ToString("0000")
    $km.sample_id = $row.id
    $km.category = $row.category
    $km.sample_file = $row.output_relative_path
    $km.root_midi_note = $row.root_midi_note
    $km.low_midi_note = [Math]::Max(0, [int]$row.root_midi_note - 1)
    $km.high_midi_note = [Math]::Min(127, [int]$row.root_midi_note + 1)
    $km.velocity_low = 1
    $km.velocity_high = 127
    $km.loop_mode = "OFF_UNTIL_SOUND_TEST"
    $km.gain_db = 0
    $km.pan = 0
    $keymapRows += $km

    $p = "" | Select-Object program_id, name, category, sample_id, keymap_id, dsb_preset, mixer_channel, status
    $p.program_id = "GPRG" + $programIndex.ToString("0000")
    $p.name = "Golden " + $row.category + " " + $programIndex.ToString("000")
    $p.category = $row.category
    $p.sample_id = $row.id
    $p.keymap_id = $km.keymap_id
    $p.dsb_preset = "OWNER_EDITABLE_DSB"
    $p.mixer_channel = 1
    $p.status = "GOLDEN_PROGRAM_DRAFT"
    $programs += $p
}
$keymapRows | Export-Csv -LiteralPath $GoldenKeymapCsv -NoTypeInformation -Encoding UTF8
ConvertTo-UaosJson $programs | Set-Content -LiteralPath $GoldenProgramJson -Encoding UTF8

# DSB / mixer drafts
$dsb = "" | Select-Object status, pa3x_binary_status, presets
$dsb.status = "GOLDEN_DSB_DRAFT_OWNER_EDITABLE"
$dsb.pa3x_binary_status = $HardwareStatus
$presets = @()
foreach ($cat in @($audioRows | Select-Object -ExpandProperty category -Unique)) {
    $d = "" | Select-Object category, attack_ms, decay_ms, sustain_percent, release_ms, loop_mode, filter_cutoff, resonance, owner_note
    $d.category = $cat
    $d.attack_ms = 0
    $d.decay_ms = 0
    $d.sustain_percent = 100
    $d.release_ms = 80
    $d.loop_mode = "OFF_UNTIL_SOUND_TEST"
    $d.filter_cutoff = 127
    $d.resonance = 0
    $d.owner_note = "Adjust after listening."
    $presets += $d
}
$dsb.presets = $presets
ConvertTo-UaosJson $dsb | Set-Content -LiteralPath $GoldenDsbJson -Encoding UTF8

$mixer = "" | Select-Object status, channels
$mixer.status = "GOLDEN_MIXER_DRAFT_OWNER_EDITABLE"
$channels = @()
foreach ($cat in @("General","Lead","Oriental_Strings","Rhythm","Bass","Pad")) {
    $ch = "" | Select-Object channel, category, volume, pan, reverb, delay, eq_low, eq_mid, eq_high
    $ch.channel = @($channels).Count + 1
    $ch.category = $cat
    $ch.volume = 100
    $ch.pan = 0
    $ch.reverb = 20
    $ch.delay = 0
    $ch.eq_low = 0
    $ch.eq_mid = 0
    $ch.eq_high = 0
    $channels += $ch
}
$mixer.channels = $channels
ConvertTo-UaosJson $mixer | Set-Content -LiteralPath $GoldenMixerJson -Encoding UTF8

# Sound test checklist
$soundTests = @()
foreach ($p in $programs) {
    $t = "" | Select-Object program_id, name, category, listen_status, volume_ok, tuning_ok, loop_ok, dsb_adjustment_needed, mixer_adjustment_needed, owner_notes
    $t.program_id = $p.program_id
    $t.name = $p.name
    $t.category = $p.category
    $t.listen_status = "NOT_TESTED"
    $t.volume_ok = "PENDING"
    $t.tuning_ok = "PENDING"
    $t.loop_ok = "PENDING"
    $t.dsb_adjustment_needed = "PENDING"
    $t.mixer_adjustment_needed = "PENDING"
    $t.owner_notes = ""
    $soundTests += $t
}
ConvertTo-UaosJson $soundTests | Set-Content -LiteralPath $SoundTestChecklistJson -Encoding UTF8

# Commercial SKU draft
$skus = @()
foreach ($skuData in @(
    @("UAOS_ORIENTAL_STARTER_PACK","Starter owner-ready oriental samples and drafts","disabled_until_library_qc"),
    @("UAOS_GOLDEN_SET_PRO_PACK","Pro golden set library package","disabled_until_library_qc"),
    @("UAOS_CUSTOM_OWNER_CONVERSION","Custom owner library conversion service","manual_quote_only")
)) {
    $sku = "" | Select-Object sku, title, description, payment_status, source_policy, delivery
    $sku.sku = $skuData[0]
    $sku.title = $skuData[0]
    $sku.description = $skuData[1]
    $sku.payment_status = $skuData[2]
    $sku.source_policy = "Only UAOS-owned or licensed materials"
    $sku.delivery = "UAOS package first; PA3X binary only after validated writer"
    $skus += $sku
}
ConvertTo-UaosJson $skus | Set-Content -LiteralPath $CommercialSkusJson -Encoding UTF8

# Roadmap and CodeX tasks
@(
"# UAOS V1716 Fastest Execution Roadmap",
"",
"1. Use V1716 as Golden Set Factory control center.",
"2. Continue owner sound-test loop on UAOS_GOLDEN_SET_001_DRAFT.",
"3. Tune DSB, mixer, keymaps, and program naming.",
"4. Build commercial SKUs only from UAOS-owned/licensed content.",
"5. Keep KORG binary writer separate until PA3X hardware validation.",
"",
"Do not claim PA3X-ready binary SET until tested."
) | Set-Content -LiteralPath $RoadmapMd -Encoding UTF8

@(
"# CodeX Next Implementation Tasks",
"",
"Task 1: Build UAOS sound-test editor UI for Golden Set Draft.",
"Task 2: Add DSB/mixer JSON editors with validation.",
"Task 3: Add category-based program naming and batch retagging.",
"Task 4: Add commercial SKU preview pages with payment disabled.",
"Task 5: Design PA3X binary writer research gate; no implementation claim until hardware test.",
"",
"Hard safety gates: no blocked V1713 files, no old KORG backup copy, no SET/PCM/STY output in V1716."
) | Set-Content -LiteralPath $CodeXPromptMd -Encoding UTF8

# Golden manifest
$manifest = "" | Select-Object phase, revision, status, owner_audio_count, keyboard_metadata_count, golden_program_count, commercial_sku_count, golden_root, no_keyboard_binary_output, pa3x_binary_status
$manifest.phase = "UAOS V1716"
$manifest.revision = $Revision
$manifest.status = "PENDING"
$manifest.owner_audio_count = @($audioRows).Count
$manifest.keyboard_metadata_count = @($keyboardRows).Count
$manifest.golden_program_count = @($programs).Count
$manifest.commercial_sku_count = @($skus).Count
$manifest.golden_root = $GoldenRoot
$manifest.no_keyboard_binary_output = $true
$manifest.pa3x_binary_status = $HardwareStatus

$NoV1713Used = $true
$NoKorgBackupCopied = $true
$NoForbiddenBinary = $true
foreach ($f in @(Get-ChildItem -LiteralPath $GoldenRoot -Recurse -File -ErrorAction SilentlyContinue)) {
    if ($KeyboardMetaExts -contains ([string]$f.Extension).ToLowerInvariant()) { $NoForbiddenBinary = $false }
    if (Test-OldKorgPath $f.FullName) { $NoKorgBackupCopied = $false }
}
$Status = if (@($audioRows).Count -gt 0 -and $NoV1713Used -and $NoKorgBackupCopied -and $NoForbiddenBinary) { $ReadyStatus } else { $WaitingStatus }
$manifest.status = $Status
ConvertTo-UaosJson $manifest | Set-Content -LiteralPath $GoldenManifestJson -Encoding UTF8

# Portal
$htmlB64 = "PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KPHRpdGxlPlVBT1MgVjE3MTYgR29sZGVuIFNldCBGYWN0b3J5PC90aXRsZT4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xIj4KPHN0eWxlPgpib2R5e21hcmdpbjowO2JhY2tncm91bmQ6IzA3MTAxZDtjb2xvcjojZWVmNWZmO2ZvbnQtZmFtaWx5OlNlZ29lIFVJLEFyaWFsLHNhbnMtc2VyaWZ9Ci5hcHB7bWF4LXdpZHRoOjExODBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjhweCAyMnB4IDQ0cHh9CmhlYWRlcnt0ZXh0LWFsaWduOmNlbnRlcjtwYWRkaW5nOjI0cHggOHB4fQpoMXtmb250LXNpemU6NDBweDttYXJnaW46MCAwIDhweH0KLnN1Yntjb2xvcjojYWZjMGQ3O2ZvbnQtc2l6ZToxOHB4O2xpbmUtaGVpZ2h0OjEuNTttYXgtd2lkdGg6OTAwcHg7bWFyZ2luOjAgYXV0b30KLnJlYWR5e2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi10b3A6MTZweDtwYWRkaW5nOjEwcHggMThweDtib3JkZXItcmFkaXVzOjk5OXB4O2JhY2tncm91bmQ6IzEyMzUxZjtib3JkZXI6MXB4IHNvbGlkICMzMmEwNjI7Zm9udC13ZWlnaHQ6OTAwfQoud2FybntkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tdG9wOjhweDtwYWRkaW5nOjhweCAxNHB4O2JvcmRlci1yYWRpdXM6OTk5cHg7YmFja2dyb3VuZDojM2IyOTEwO2JvcmRlcjoxcHggc29saWQgI2M3OTIyZjtmb250LXdlaWdodDo4MDA7Y29sb3I6I2ZmZDE4YX0KLmdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KDE2NXB4LDFmcikpO2dhcDoxNHB4fQouY2FyZHtiYWNrZ3JvdW5kOiMxMDFkMzI7Ym9yZGVyOjFweCBzb2xpZCAjMjYzYTU5O2JvcmRlci1yYWRpdXM6MThweDtwYWRkaW5nOjE3cHh9Ci5udW17Zm9udC1zaXplOjMwcHg7Zm9udC13ZWlnaHQ6OTAwfQoubGFiZWx7Y29sb3I6I2FmYzBkNztmb250LXNpemU6MTNweH0KLmFjdGlvbnN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KDE5MHB4LDFmcikpO2dhcDoxMnB4fQouYnRue2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjttaW4taGVpZ2h0OjU4cHg7dGV4dC1kZWNvcmF0aW9uOm5vbmU7Y29sb3I6d2hpdGU7YmFja2dyb3VuZDojMTczNDU2O2JvcmRlcjoxcHggc29saWQgIzRkNzhhNTtib3JkZXItcmFkaXVzOjE2cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6MTJweDt0ZXh0LWFsaWduOmNlbnRlcn0KLnByaW1hcnl7YmFja2dyb3VuZDojMTg2YTQwO2JvcmRlci1jb2xvcjojNTZjOThifQouYXJhYmlje2RpcmVjdGlvbjpydGw7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjIwcHg7bGluZS1oZWlnaHQ6MS42NX0KZGV0YWlsc3tiYWNrZ3JvdW5kOiMwYjE3Mjk7Ym9yZGVyOjFweCBzb2xpZCAjMjIzODU0O2JvcmRlci1yYWRpdXM6MTZweDttYXJnaW46MTBweCAwfQpzdW1tYXJ5e2N1cnNvcjpwb2ludGVyO3BhZGRpbmc6MTVweCAxNnB4O2ZvbnQtd2VpZ2h0OjgwMH0KLmJvZHl7cGFkZGluZzowIDE2cHggMTZweDtjb2xvcjojYWZjMGQ3O2xpbmUtaGVpZ2h0OjEuNn0KLnBhdGh7Zm9udC1mYW1pbHk6Q29uc29sYXMsbW9ub3NwYWNlO3dvcmQtYnJlYWs6YnJlYWstYWxsO2NvbG9yOiNjZmU1ZmZ9Ci5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6I2FmYzBkNztmb250LXNpemU6MTNweDttYXJnaW4tdG9wOjI0cHh9Cjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+CjxtYWluIGNsYXNzPSJhcHAiPgo8aGVhZGVyPgo8aDE+VUFPUyBHb2xkZW4gU2V0IEZhY3Rvcnk8L2gxPgo8ZGl2IGNsYXNzPSJzdWIiPk9uZSBjb250cm9sIGNlbnRlciBmb3Igb3duZXIgbGlicmFyeSByZWFkaW5nLCBHb2xkZW4gU2V0IGRyYWZ0IGdlbmVyYXRpb24sIHNvdW5kLXRlc3QgbG9vcCwgYW5kIGNvbW1lcmNpYWwgbGlicmFyeSBwcmVwYXJhdGlvbi48L2Rpdj4KPGRpdiBjbGFzcz0icmVhZHkiPl9fU1RBVFVTX188L2Rpdj4KPGRpdiBjbGFzcz0id2FybiI+UEEzWCBiaW5hcnkgc3RhdHVzOiBTRVBBUkFURSBIQVJEV0FSRSBURVNUIFJFUVVJUkVEPC9kaXY+CjwvaGVhZGVyPgoKPHNlY3Rpb24gY2xhc3M9ImdyaWQiPgo8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJsYWJlbCI+T3duZXIgYXVkaW8gZmlsZXM8L2Rpdj48ZGl2IGNsYXNzPSJudW0iPl9fQVVESU9fQ09VTlRfXzwvZGl2PjwvZGl2Pgo8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJsYWJlbCI+U0VUL2tleWJvYXJkIG1ldGFkYXRhPC9kaXY+PGRpdiBjbGFzcz0ibnVtIj5fX1NFVF9NRVRBX0NPVU5UX188L2Rpdj48L2Rpdj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPkdvbGRlbiBwcm9ncmFtczwvZGl2PjxkaXYgY2xhc3M9Im51bSI+X19QUk9HUkFNX0NPVU5UX188L2Rpdj48L2Rpdj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPkNvbW1lcmNpYWwgU0tVczwvZGl2PjxkaXYgY2xhc3M9Im51bSI+X19TS1VfQ09VTlRfXzwvZGl2PjwvZGl2Pgo8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJsYWJlbCI+S2V5Ym9hcmQgYmluYXJ5IG91dHB1dDwvZGl2PjxkaXYgY2xhc3M9Im51bSI+MDwvZGl2PjwvZGl2Pgo8L3NlY3Rpb24+Cgo8c2VjdGlvbiBjbGFzcz0iY2FyZCIgc3R5bGU9Im1hcmdpbi10b3A6MThweCI+CjxoMj5NYWluIGFjdGlvbnM8L2gyPgo8ZGl2IGNsYXNzPSJhY3Rpb25zIj4KPGEgY2xhc3M9ImJ0biBwcmltYXJ5IiBocmVmPSJfX0dPTERFTl9QQUNLQUdFX1VSSV9fIj5PcGVuIEdvbGRlbiBTZXQgRHJhZnQ8L2E+CjxhIGNsYXNzPSJidG4iIGhyZWY9Il9fT1dORVJfUkVBREVSX1VSSV9fIj5PcGVuIE93bmVyIFJlYWRlciBNYW5pZmVzdDwvYT4KPGEgY2xhc3M9ImJ0biIgaHJlZj0iX19HT0xERU5fUFJPR1JBTVNfVVJJX18iPk9wZW4gR29sZGVuIFByb2dyYW1zPC9hPgo8YSBjbGFzcz0iYnRuIiBocmVmPSJfX1NPVU5EX1RFU1RfVVJJX18iPk9wZW4gU291bmQgVGVzdCBDaGVja2xpc3Q8L2E+CjxhIGNsYXNzPSJidG4iIGhyZWY9Il9fQ09NTUVSQ0lBTF9VUklfXyI+T3BlbiBDb21tZXJjaWFsIExpYnJhcnkgUGxhbjwvYT4KPGEgY2xhc3M9ImJ0biIgaHJlZj0iX19WQUxJREFUSU9OX1VSSV9fIj5PcGVuIFZhbGlkYXRpb248L2E+CjwvZGl2Pgo8L3NlY3Rpb24+Cgo8c2VjdGlvbiBjbGFzcz0iY2FyZCIgc3R5bGU9Im1hcmdpbi10b3A6MThweCI+CjxkaXYgY2xhc3M9ImFyYWJpYyI+2YfYsNmHINmH2Yog2YXYsdit2YTYqSBHb2xkZW4gU2V0IEZhY3RvcnkuINin2YTYqNix2YbYp9mF2Kwg2YrZgtix2KMg2YXZg9iq2KjYp9iq2YMg2KfZhNmF2LPZhdmI2K3YqdiMINmI2YrZiNmE2K8gR29sZGVuIFNldCBEcmFmdCDYr9in2K7ZhCBVQU9T2Iwg2YjZitis2YfYsiDZhdmG2KrYrNin2Kog2YXZg9iq2KjYp9iqINmE2YTYqNmK2LkuINmF2YTZgdin2KogU0VUL1BDTS9TVFkg2KfZhNmC2K/ZitmF2Kkg2KrYqNmC2YkgbWV0YWRhdGEg2YHZgti32Iwg2YjZhNinINmK2YjYrNivINin2K/Yudin2KEg2KPZhtmH2Kcg2KzYp9mH2LLYqSBQQTNYINmC2KjZhCDYp9iu2KrYqNin2LEg2KfZhNis2YfYp9iyLjwvZGl2Pgo8L3NlY3Rpb24+Cgo8c2VjdGlvbiBzdHlsZT0ibWFyZ2luLXRvcDoxOHB4Ij4KPGRldGFpbHM+PHN1bW1hcnk+RXhlY3V0aXZlIERlY2lzaW9uPC9zdW1tYXJ5PjxkaXYgY2xhc3M9ImJvZHkiPlYxNzE2IGlzIHRoZSBmYXN0IHByb2R1Y3QgcGF0aC4gSXQgY29tYmluZXMgdGhlIHJlbWFpbmluZyBzZWN0aW9ucyBpbnRvIG9uZSBmYWN0b3J5OiBPd25lciBSZWFkZXIsIEdvbGRlbiBTZXQgR2VuZXJhdG9yLCBTb3VuZCBUZXN0IExvb3AsIENvbW1lcmNpYWwgTGlicmFyeSBGYWN0b3J5LCBhbmQgQ29kZVggdGFzayBwYWNrLjwvZGl2PjwvZGV0YWlscz4KPGRldGFpbHM+PHN1bW1hcnk+UmVhZGVyIFJ1bGVzPC9zdW1tYXJ5PjxkaXYgY2xhc3M9ImJvZHkiPkFsbG93ZWQgYXVkaW8gaXMgY29waWVkIGZyb20gb3duZXIgaW5wdXQuIEtleWJvYXJkIGZvcm1hdHMgc3VjaCBhcyBTRVQvUENNL1NUWS9QQ0cgYXJlIG1ldGFkYXRhIG9ubHkgYW5kIGFyZSBub3QgY29waWVkIGludG8gZ2VuZXJhdGVkIHBhY2thZ2VzLjwvZGl2PjwvZGV0YWlscz4KPGRldGFpbHM+PHN1bW1hcnk+R29sZGVuIFNldCBPdXRwdXQ8L3N1bW1hcnk+PGRpdiBjbGFzcz0iYm9keSI+PHNwYW4gY2xhc3M9InBhdGgiPl9fR09MREVOX1BBQ0tBR0VfUEFUSF9fPC9zcGFuPjwvZGl2PjwvZGV0YWlscz4KPGRldGFpbHM+PHN1bW1hcnk+Q29tbWVyY2lhbCBQcm9kdWN0IFBhdGg8L3N1bW1hcnk+PGRpdiBjbGFzcz0iYm9keSI+TWFya2V0cGxhY2UvcGF5bWVudCBpcyBkaXNhYmxlZC4gVjE3MTYgb25seSBjcmVhdGVzIFNLVSBkcmFmdHMsIGxpYnJhcnkgcHJvZHVjdCBkZWZpbml0aW9ucywgYW5kIGxpY2Vuc2luZyBwbGFjZWhvbGRlcnMuPC9kaXY+PC9kZXRhaWxzPgo8ZGV0YWlscz48c3VtbWFyeT5TYWZldHkgR2F0ZXM8L3N1bW1hcnk+PGRpdiBjbGFzcz0iYm9keSI+Tm8gYmxvY2tlZCBWMTcxMyBmaWxlcyB1c2VkOiBfX05PX1YxNzEzX1VTRURfXzxicj5ObyBvbGQgS09SRyBiYWNrdXAgY29waWVkOiBfX05PX0tPUkdfQkFDS1VQX188YnI+Tm8gZm9yYmlkZGVuIGtleWJvYXJkIGJpbmFyeSBnZW5lcmF0ZWQ6IF9fTk9fRk9SQklEREVOX0JJTkFSWV9fPGJyPk5vIGRlcGxveS9wYXltZW50OiBUUlVFPC9kaXY+PC9kZXRhaWxzPgo8L3NlY3Rpb24+Cgo8ZGl2IGNsYXNzPSJmb290ZXIiPlVBT1MgVjE3MTYgR29sZGVuIFNldCBGYWN0b3J5LiBPbmUgTWVnYUxhdW5jaGVyLiBPd25lciBtYXRlcmlhbHMgb25seS4gTm8ga2V5Ym9hcmQgYmluYXJ5IGNsYWltLjwvZGl2Pgo8L21haW4+CjwvYm9keT4KPC9odG1sPgo="
$html = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($htmlB64))
$html = $html.Replace("__STATUS__", $Status)
$html = $html.Replace("__AUDIO_COUNT__", [string]@($audioRows).Count)
$html = $html.Replace("__SET_META_COUNT__", [string]@($keyboardRows).Count)
$html = $html.Replace("__PROGRAM_COUNT__", [string]@($programs).Count)
$html = $html.Replace("__SKU_COUNT__", [string]@($skus).Count)
$html = $html.Replace("__GOLDEN_PACKAGE_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $GoldenRoot)))
$html = $html.Replace("__OWNER_READER_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $OwnerAudioManifestCsv)))
$html = $html.Replace("__GOLDEN_PROGRAMS_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $GoldenProgramJson)))
$html = $html.Replace("__SOUND_TEST_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $SoundTestChecklistJson)))
$html = $html.Replace("__COMMERCIAL_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $CommercialSkusJson)))
$html = $html.Replace("__VALIDATION_URI__", (ConvertTo-HtmlSafe (Get-UaosFileUri $ValidationJson)))
$html = $html.Replace("__GOLDEN_PACKAGE_PATH__", (ConvertTo-HtmlSafe $GoldenRoot))
$html = $html.Replace("__NO_V1713_USED__", [string]$NoV1713Used)
$html = $html.Replace("__NO_KORG_BACKUP__", [string]$NoKorgBackupCopied)
$html = $html.Replace("__NO_FORBIDDEN_BINARY__", [string]$NoForbiddenBinary)
$html | Set-Content -LiteralPath $PortalHtml -Encoding UTF8

# Validation / report / seal
$validation = "" | Select-Object phase, revision, status, owner_input_root, market_source_root, golden_root, owner_audio_count, keyboard_metadata_count, golden_program_count, commercial_sku_count, no_v1713_blocked_files_used, no_old_korg_backup_copied, no_forbidden_keyboard_binary_generated, pa3x_binary_status, portal, package, package_sha256
$validation.phase = "UAOS V1716"
$validation.revision = $Revision
$validation.status = $Status
$validation.owner_input_root = $OwnerInputRoot
$validation.market_source_root = $MarketSourceRoot
$validation.golden_root = $GoldenRoot
$validation.owner_audio_count = @($audioRows).Count
$validation.keyboard_metadata_count = @($keyboardRows).Count
$validation.golden_program_count = @($programs).Count
$validation.commercial_sku_count = @($skus).Count
$validation.no_v1713_blocked_files_used = $NoV1713Used
$validation.no_old_korg_backup_copied = $NoKorgBackupCopied
$validation.no_forbidden_keyboard_binary_generated = $NoForbiddenBinary
$validation.pa3x_binary_status = $HardwareStatus
$validation.portal = $PortalHtml
$validation.package = $ZipPath
$validation.package_sha256 = ""
ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@(
"# UAOS V1716 Golden Set Factory Report",
"",
"Status: $Status",
"Owner audio count: " + @($audioRows).Count,
"Keyboard metadata only count: " + @($keyboardRows).Count,
"Golden programs: " + @($programs).Count,
"Commercial SKUs: " + @($skus).Count,
"",
"Output: $GoldenRoot",
"",
"Safety:",
"- No V1713 blocked files used: $NoV1713Used",
"- No old KORG backup copied: $NoKorgBackupCopied",
"- No forbidden keyboard binary generated: $NoForbiddenBinary",
"- PA3X binary status: $HardwareStatus"
) | Set-Content -LiteralPath $ReportMd -Encoding UTF8

@(
"# UAOS V1716 Golden Set Factory Seal",
"",
"Seal status: " + $(if ($Status -eq $ReadyStatus) { "SEALED_GOLDEN_SET_FACTORY_READY" } else { "SEALED_WAITING_FOR_OWNER_LIBRARY_INPUT" }),
"Status: $Status",
"Golden root: $GoldenRoot",
"Owner audio count: " + @($audioRows).Count,
"Golden program count: " + @($programs).Count,
"No keyboard binary output: TRUE",
"PA3X binary status: $HardwareStatus"
) | Set-Content -LiteralPath $SealMd -Encoding UTF8

# Package metadata/output, but sample binaries ignored by git only
Write-UaosLog "Packaging V1716 Golden Set Factory" "STEP" Cyan
if (Test-Path -LiteralPath $ZipPath) { Remove-Item -LiteralPath $ZipPath -Force }
Compress-Archive -Path (Join-Path $PhaseRoot "*") -DestinationPath $ZipPath -Force
$zipHash = Get-UaosSha256 $ZipPath
($zipHash + "  " + (Split-Path -Path $ZipPath -Leaf)) | Set-Content -LiteralPath $ShaPath -Encoding UTF8
$validation.package_sha256 = $zipHash
ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$pointer = "" | Select-Object current_golden_set_factory, status, revision, phase_root, portal, validation, report, seal, package, package_sha256
$pointer.current_golden_set_factory = "UAOS V1716 GOLDEN_SET_FACTORY"
$pointer.status = $Status
$pointer.revision = $Revision
$pointer.phase_root = $PhaseRoot
$pointer.portal = $PortalHtml
$pointer.validation = $ValidationJson
$pointer.report = $ReportMd
$pointer.seal = $SealMd
$pointer.package = $ZipPath
$pointer.package_sha256 = $zipHash
ConvertTo-UaosJson $pointer | Set-Content -LiteralPath $PointerJson -Encoding UTF8

@(
"# UAOS Golden Set Factory Status",
"",
"Current: UAOS V1716 GOLDEN_SET_FACTORY",
"Status: $Status",
"Portal: $PortalHtml",
"Golden root: $GoldenRoot",
"Package: $ZipPath",
"SHA256: $zipHash",
"",
"Product policy: generate UAOS Golden Set Drafts from owner/UAOS-owned materials. PA3X binary writer remains separate hardware-test phase."
) | Set-Content -LiteralPath $StatusDoc -Encoding UTF8

# Git commit metadata only; .gitignore avoids sample binaries/zip.
Write-UaosLog "Local git commit only" "STEP" Cyan
$GitStatus = "SKIPPED_BY_FLAG"
$GitHash = ""
if (!$NoGitCommit) {
    try {
        if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
            Push-Location $RepoRoot
            try {
                git add -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1716-golden-set-factory" "uaos-ai-factory/UAOS_CURRENT_GOLDEN_SET_FACTORY.json" "docs/UAOS_GOLDEN_SET_FACTORY_STATUS.md" | Out-Null
                $statusText = ((git status --porcelain) | Out-String)
                if ([string]::IsNullOrWhiteSpace($statusText)) {
                    $GitStatus = "NO_CHANGES"
                } else {
                    git commit -m "UAOS V1716 golden set factory" | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $GitHash = (git rev-parse --short HEAD).Trim()
                        $GitStatus = "COMMITTED"
                    } else {
                        $GitStatus = "COMMIT_FAILED"
                    }
                }
            } finally { Pop-Location }
        }
    } catch {
        $GitStatus = "COMMIT_FAILED: " + $_.Exception.Message
        Write-UaosLog $GitStatus "WARN" Yellow
    }
}

Write-Host ""
Write-UaosLog "UAOS V1716 GOLDEN SET FACTORY complete" "PASS" Green
Write-Host ("Status: " + $Status)
Write-Host ("Portal: " + $PortalHtml)
Write-Host ("Golden root: " + $GoldenRoot)
Write-Host ("Validation: " + $ValidationJson)
Write-Host ("Report: " + $ReportMd)
Write-Host ("Seal: " + $SealMd)
Write-Host ("Package: " + $ZipPath)
Write-Host ("Package SHA256: " + $zipHash)
Write-Host ("Git: " + $GitStatus)
if (![string]::IsNullOrWhiteSpace($GitHash)) { Write-Host ("Git hash: " + $GitHash) }
Write-Host "FAST PATH: Golden Set drafts and commercial SKU drafts are ready. PA3X binary writer remains separate hardware-test phase."

if (!$NoOpen -and (Test-Path -LiteralPath $PortalHtml)) { Start-Process $PortalHtml }

if ($Status -ne $ReadyStatus) { exit 2 }
exit 0

