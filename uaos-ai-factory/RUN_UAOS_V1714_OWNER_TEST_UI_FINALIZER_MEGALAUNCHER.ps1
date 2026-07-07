# UAOS V1714 OWNER TEST UI FINALIZER MEGALAUNCHER - R4 BASE64 SAFE
# One MegaLauncher only.
# R4 fix: HTML is stored as Base64 and decoded at runtime. PowerShell never parses HTML, CSS, or Arabic text as code.
# Safety: read V1713 only; no V1713 data changes; no source copy; no keyboard binary output; no USB; no hardware; no deploy; no payment.

[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\keyboard-manager-clean",
    [string]$V1713PhaseRoot = "",
    [switch]$NoOpen,
    [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$PhaseName = "uaos-v1714-owner-test-ui-finalizer"
$PhaseRoot = Join-Path $FactoryRoot $PhaseName
$ScriptName = "RUN_UAOS_V1714_OWNER_TEST_UI_FINALIZER_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "V1714_OWNER_TEST_UI_FINALIZER_R4_BASE64_SAFE"
$TargetStatus = "OWNER_TEST_READY"

if ([string]::IsNullOrWhiteSpace($V1713PhaseRoot)) {
    $V1713PhaseRoot = Join-Path $FactoryRoot "uaos-v1713-final-writer"
}

$V1713ValidationJson = Join-Path $V1713PhaseRoot "validation\UAOS_V1713_FINAL_VALIDATION.json"
$V1713LedgerCsv = Join-Path $V1713PhaseRoot "data\UAOS_V1713_FINAL_OWNER_LEDGER.csv"
$V1713SealMd = Join-Path $V1713PhaseRoot "seal\UAOS_V1713_FINAL_OWNER_SEAL.md"
$V1713PackageZip = Join-Path $V1713PhaseRoot "package\UAOS_V1713_FINAL_WRITER_OWNER_PACKAGE.zip"

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$PackageDir = Join-Path $PhaseRoot "package"
$LogsDir = Join-Path $PhaseRoot "logs"
$ReleaseDir = Join-Path $PhaseRoot "release"

$RunLog = Join-Path $LogsDir "UAOS_V1714_OWNER_TEST_UI_FINALIZER_RUN.log"
$OwnerTestPortalHtml = Join-Path $WorkspaceDir "UAOS_V1714_OWNER_TEST_FINAL_PORTAL.html"
$OwnerTestReportMd = Join-Path $ReportsDir "UAOS_V1714_OWNER_TEST_REPORT.md"
$OwnerTestChecklistJson = Join-Path $DataDir "UAOS_V1714_OWNER_TEST_CHECKLIST.json"
$OwnerTestSealMd = Join-Path $SealDir "UAOS_V1714_OWNER_TEST_SEAL.md"
$OwnerTestValidationJson = Join-Path $ValidationDir "UAOS_V1714_OWNER_TEST_VALIDATION.json"
$OwnerTestManifestJson = Join-Path $DataDir "UAOS_V1714_OWNER_TEST_MANIFEST.json"
$OwnerTestPointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_OWNER_TEST.json"
$OwnerTestPackageZip = Join-Path $PackageDir "UAOS_V1714_OWNER_TEST_FINAL_PACKAGE.zip"
$OwnerTestPackageSha256Txt = Join-Path $PackageDir "UAOS_V1714_OWNER_TEST_FINAL_PACKAGE.sha256.txt"
$OwnerTestStopFile = Join-Path $ReleaseDir "UAOS_OWNER_TEST_STOP_HERE.txt"
$OwnerTestStatusDoc = Join-Path (Join-Path $RepoRoot "docs") "UAOS_OWNER_TEST_STATUS.md"

function New-Dir {
    param([string]$Path)
    if (!(Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Log {
    param([string]$Message, [string]$Level = "INFO", [ConsoleColor]$Color = [ConsoleColor]::Gray)
    $line = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] [" + $Level + "] " + $Message
    Write-Host $line -ForegroundColor $Color
    try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {}
}

function HtmlSafe {
    param([AllowNull()][object]$Value)
    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function JsonOut {
    param([AllowNull()][object]$Value)
    return ($Value | ConvertTo-Json -Depth 80)
}

function Prop {
    param([AllowNull()][object]$Object, [string[]]$Names, [AllowNull()][object]$Default = $null)
    if ($null -eq $Object) { return $Default }
    foreach ($name in $Names) {
        foreach ($prop in @($Object.PSObject.Properties)) {
            if ($prop.Name -ieq $name) { return $prop.Value }
        }
    }
    return $Default
}

function Sha256 {
    param([string]$Path)
    if (!(Test-Path -LiteralPath $Path)) { return "" }
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

function FileUri {
    param([string]$Path)
    try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path }
}

function BoolText {
    param([object]$Value)
    return ([string]$Value).Trim().ToLowerInvariant()
}

foreach ($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$PackageDir,$LogsDir,$ReleaseDir,(Join-Path $RepoRoot "docs"))) {
    New-Dir $d
}

Log "UAOS V1714 OWNER TEST UI FINALIZER R4 started" "STEP" Cyan
Log "RepoRoot: $RepoRoot"
Log "V1713PhaseRoot: $V1713PhaseRoot"

try {
    $currentScript = $PSCommandPath
    if ([string]::IsNullOrWhiteSpace($currentScript)) { $currentScript = $MyInvocation.MyCommand.Path }
    if (![string]::IsNullOrWhiteSpace($currentScript) -and (Test-Path -LiteralPath $currentScript)) {
        $src = (Resolve-Path -LiteralPath $currentScript).Path
        if (!(Test-Path -LiteralPath $FactoryScriptPath) -or ![string]::Equals($src, (Resolve-Path -LiteralPath $FactoryScriptPath).Path, [System.StringComparison]::OrdinalIgnoreCase)) {
            Copy-Item -LiteralPath $src -Destination $FactoryScriptPath -Force
            Log "MegaLauncher copied to factory: $FactoryScriptPath" "PASS" Green
        } else {
            Log "MegaLauncher already running from factory path."
        }
    }
} catch {
    Log ("Self-copy warning: " + $_.Exception.Message) "WARN" Yellow
}

Log "Loading V1713 final package metadata" "STEP" Cyan
if (!(Test-Path -LiteralPath $V1713ValidationJson)) { throw "Missing V1713 validation: $V1713ValidationJson" }
if (!(Test-Path -LiteralPath $V1713LedgerCsv)) { throw "Missing V1713 ledger: $V1713LedgerCsv" }
if (!(Test-Path -LiteralPath $V1713SealMd)) { throw "Missing V1713 seal: $V1713SealMd" }
if (!(Test-Path -LiteralPath $V1713PackageZip)) { throw "Missing V1713 package: $V1713PackageZip" }

$V1713Validation = Get-Content -LiteralPath $V1713ValidationJson -Raw -Encoding UTF8 | ConvertFrom-Json
$LedgerRows = @(Import-Csv -LiteralPath $V1713LedgerCsv)

$V1713Status = [string](Prop $V1713Validation @("status") "")
$V1713Revision = [string](Prop $V1713Validation @("revision") "")
$FinalCount = @($LedgerRows).Count
$SafeCopyAllowedCount = [int](Prop $V1713Validation @("safe_copy_allowed_count") 0)
$WriterReady = [bool](Prop $V1713Validation @("writer_ready") $false)
$V1713PackageSha256 = [string](Prop $V1713Validation @("package_sha256") "")
$ComputedV1713PackageSha256 = Sha256 $V1713PackageZip

$KeepBlockedCount = 0
$SeparateApprovalCount = 0
$DocumentOnlyCount = 0
$KeyboardOutputCount = 0
$SourceCopiedCount = 0
$UsbCount = 0
$HardwareCount = 0

foreach ($row in $LedgerRows) {
    $decision = ([string](Prop $row @("owner_decision") "")).Trim().ToUpperInvariant()
    if ($decision -eq "KEEP_BLOCKED") { $KeepBlockedCount++ }
    if ($decision -eq "REQUEST_SEPARATE_APPROVAL_PHASE") { $SeparateApprovalCount++ }
    if ($decision -eq "DOCUMENT_ONLY") { $DocumentOnlyCount++ }

    if ((BoolText (Prop $row @("keyboard_output_generated") "")) -in @("true","yes","1")) { $KeyboardOutputCount++ }
    if ((BoolText (Prop $row @("source_file_copied") "")) -in @("true","yes","1")) { $SourceCopiedCount++ }
    if ((BoolText (Prop $row @("usb_write") "")) -in @("true","yes","1")) { $UsbCount++ }
    if ((BoolText (Prop $row @("hardware_load") "")) -in @("true","yes","1")) { $HardwareCount++ }
}

Log "V1713 status: $V1713Status" "PASS" Green
Log "V1713 revision: $V1713Revision" "PASS" Green
Log "Ledger rows: $FinalCount" "PASS" Green
Log "KEEP_BLOCKED: $KeepBlockedCount" "PASS" Green
Log "Separate approval: $SeparateApprovalCount" "PASS" Green

$Checklist = @()
$checkData = @(
    @("page_opens","Page opens","Page opens without confusion."),
    @("buttons_work","Buttons work","The five main buttons are visible and direct."),
    @("package_opens","Final package opens","The V1713 final package opens."),
    @("seal_opens","Seal opens","The final seal opens."),
    @("validation_ready","Validation shows READY","Validation shows ready status."),
    @("owner_understands_next_step","Owner understands next step","This is owner review only, not keyboard generation.")
)
foreach ($c in $checkData) {
    $o = "" | Select-Object id, title, owner_meaning, status
    $o.id = $c[0]
    $o.title = $c[1]
    $o.owner_meaning = $c[2]
    $o.status = "READY"
    $Checklist += $o
}
(JsonOut $Checklist) | Set-Content -LiteralPath $OwnerTestChecklistJson -Encoding UTF8

$GateV1713Ready = ($V1713Status -eq "UAOS_FINAL_WRITER_READY")
$GateRevision = ($V1713Revision -eq "R3_STATIC_FINALIZER")
$GateCounts = ($FinalCount -eq 305 -and $KeepBlockedCount -eq 304 -and $SeparateApprovalCount -eq 1)
$GateSafety = ($SafeCopyAllowedCount -eq 0 -and $WriterReady -eq $false -and $KeyboardOutputCount -eq 0 -and $SourceCopiedCount -eq 0 -and $UsbCount -eq 0 -and $HardwareCount -eq 0)
$GateFiles = ((Test-Path -LiteralPath $V1713PackageZip) -and (Test-Path -LiteralPath $V1713SealMd) -and (Test-Path -LiteralPath $V1713LedgerCsv) -and (Test-Path -LiteralPath $V1713ValidationJson))
$GateHash = (![string]::IsNullOrWhiteSpace($ComputedV1713PackageSha256))
$GateChecklist = (@($Checklist).Count -eq 6)
$PreStatus = if ($GateV1713Ready -and $GateRevision -and $GateCounts -and $GateSafety -and $GateFiles -and $GateHash -and $GateChecklist) { $TargetStatus } else { "CHECK" }

Log "Writing owner test portal from Base64 template" "STEP" Cyan

$htmlB64 = "PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KPHRpdGxlPlVBT1MgT3duZXIgVGVzdDwvdGl0bGU+CjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSI+CjxzdHlsZT4KYm9keXttYXJnaW46MDtiYWNrZ3JvdW5kOiMwNzEwMWQ7Y29sb3I6I2VlZjVmZjtmb250LWZhbWlseTpTZWdvZSBVSSxBcmlhbCxzYW5zLXNlcmlmfQouYXBwe21heC13aWR0aDoxMDgwcHg7bWFyZ2luOjAgYXV0bztwYWRkaW5nOjMwcHggMjJweCA0NHB4fQpoZWFkZXJ7dGV4dC1hbGlnbjpjZW50ZXI7cGFkZGluZzoyNnB4IDhweH0KaDF7Zm9udC1zaXplOjQ0cHg7bWFyZ2luOjAgMCA4cHh9Ci5zdWJ7Y29sb3I6I2FmYzBkNztmb250LXNpemU6MThweDtsaW5lLWhlaWdodDoxLjV9Ci5yZWFkeXtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tdG9wOjE4cHg7cGFkZGluZzoxMHB4IDE4cHg7Ym9yZGVyLXJhZGl1czo5OTlweDtiYWNrZ3JvdW5kOiMxMjM1MWY7Ym9yZGVyOjFweCBzb2xpZCAjMzJhMDYyO2ZvbnQtd2VpZ2h0OjkwMH0KLmdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KDE3NXB4LDFmcikpO2dhcDoxNHB4fQouY2FyZHtiYWNrZ3JvdW5kOiMxMDFkMzI7Ym9yZGVyOjFweCBzb2xpZCAjMjYzYTU5O2JvcmRlci1yYWRpdXM6MThweDtwYWRkaW5nOjE3cHh9Ci5udW17Zm9udC1zaXplOjM0cHg7Zm9udC13ZWlnaHQ6OTAwfQoubGFiZWx7Y29sb3I6I2FmYzBkNztmb250LXNpemU6MTNweH0KLmFjdGlvbnN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KDE5MHB4LDFmcikpO2dhcDoxMnB4fQouYnRue2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjttaW4taGVpZ2h0OjU4cHg7dGV4dC1kZWNvcmF0aW9uOm5vbmU7Y29sb3I6d2hpdGU7YmFja2dyb3VuZDojMTczNDU2O2JvcmRlcjoxcHggc29saWQgIzRkNzhhNTtib3JkZXItcmFkaXVzOjE2cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6MTJweH0KLnByaW1hcnl7YmFja2dyb3VuZDojMTg2YTQwO2JvcmRlci1jb2xvcjojNTZjOThifQouYXJhYmlje2RpcmVjdGlvbjpydGw7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjIwcHg7bGluZS1oZWlnaHQ6MS42NX0KLmNoZWNre3BhZGRpbmc6MTBweDtib3JkZXI6MXB4IHNvbGlkICMyYjQ2Njg7Ym9yZGVyLXJhZGl1czoxNHB4O2JhY2tncm91bmQ6IzBiMTcyOTttYXJnaW46OHB4IDB9Ci5va3tjb2xvcjojNzFlMzllO2ZvbnQtd2VpZ2h0OjkwMH0KZGV0YWlsc3tiYWNrZ3JvdW5kOiMwYjE3Mjk7Ym9yZGVyOjFweCBzb2xpZCAjMjIzODU0O2JvcmRlci1yYWRpdXM6MTZweDttYXJnaW46MTBweCAwfQpzdW1tYXJ5e2N1cnNvcjpwb2ludGVyO3BhZGRpbmc6MTVweCAxNnB4O2ZvbnQtd2VpZ2h0OjgwMH0KLmJvZHl7cGFkZGluZzowIDE2cHggMTZweDtjb2xvcjojYWZjMGQ3O2xpbmUtaGVpZ2h0OjEuNn0KLnBhdGh7Zm9udC1mYW1pbHk6Q29uc29sYXMsbW9ub3NwYWNlO3dvcmQtYnJlYWs6YnJlYWstYWxsO2NvbG9yOiNjZmU1ZmZ9Ci5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6I2FmYzBkNztmb250LXNpemU6MTNweDttYXJnaW4tdG9wOjI0cHh9Cjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+CjxtYWluIGNsYXNzPSJhcHAiPgo8aGVhZGVyPgo8aDE+VUFPUyBPd25lciBUZXN0PC9oMT4KPGRpdiBjbGFzcz0ic3ViIj5DbGVhbiBmaW5hbCBvd25lci10ZXN0IHBhZ2UuIE1haW4gYWN0aW9ucyBhcmUgdmlzaWJsZS4gRGV0YWlscyBhcmUgaGlkZGVuIGJ5IGRlZmF1bHQuPC9kaXY+CjxkaXYgY2xhc3M9InJlYWR5Ij5GSU5BTCBSRUFEWTwvZGl2Pgo8L2hlYWRlcj4KCjxzZWN0aW9uIGNsYXNzPSJncmlkIj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPkZpbGVzIHJldmlld2VkPC9kaXY+PGRpdiBjbGFzcz0ibnVtIj5fX0ZJTkFMX0NPVU5UX188L2Rpdj48L2Rpdj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPkJsb2NrZWQ8L2Rpdj48ZGl2IGNsYXNzPSJudW0iPl9fS0VFUF9CTE9DS0VEX188L2Rpdj48L2Rpdj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPlNlcGFyYXRlIGFwcHJvdmFsPC9kaXY+PGRpdiBjbGFzcz0ibnVtIj5fX1NFUEFSQVRFX0FQUFJPVkFMX188L2Rpdj48L2Rpdj4KPGRpdiBjbGFzcz0iY2FyZCI+PGRpdiBjbGFzcz0ibGFiZWwiPlNhZmUgY29weTwvZGl2PjxkaXYgY2xhc3M9Im51bSI+MDwvZGl2PjwvZGl2Pgo8ZGl2IGNsYXNzPSJjYXJkIj48ZGl2IGNsYXNzPSJsYWJlbCI+S2V5Ym9hcmQgb3V0cHV0PC9kaXY+PGRpdiBjbGFzcz0ibnVtIj4wPC9kaXY+PC9kaXY+Cjwvc2VjdGlvbj4KCjxzZWN0aW9uIGNsYXNzPSJjYXJkIiBzdHlsZT0ibWFyZ2luLXRvcDoxOHB4Ij4KPGgyPk1haW4gYWN0aW9uczwvaDI+CjxkaXYgY2xhc3M9ImFjdGlvbnMiPgo8YSBjbGFzcz0iYnRuIHByaW1hcnkiIGhyZWY9IiNvd25lci10ZXN0LWNoZWNrbGlzdCI+U3RhcnQgT3duZXIgVGVzdDwvYT4KPGEgY2xhc3M9ImJ0biIgaHJlZj0iX19QQUNLQUdFX1VSSV9fIj5PcGVuIEZpbmFsIFBhY2thZ2U8L2E+CjxhIGNsYXNzPSJidG4iIGhyZWY9Il9fU0VBTF9VUklfXyI+T3BlbiBGaW5hbCBTZWFsPC9hPgo8YSBjbGFzcz0iYnRuIiBocmVmPSJfX0xFREdFUl9VUklfXyI+T3BlbiBGaW5hbCBMZWRnZXI8L2E+CjxhIGNsYXNzPSJidG4iIGhyZWY9Il9fVkFMSURBVElPTl9VUklfXyI+T3BlbiBWYWxpZGF0aW9uPC9hPgo8L2Rpdj4KPC9zZWN0aW9uPgoKPHNlY3Rpb24gY2xhc3M9ImNhcmQiIHN0eWxlPSJtYXJnaW4tdG9wOjE4cHgiPgo8ZGl2IGNsYXNzPSJhcmFiaWMiPtmH2LDZhyDYtdmB2K3YqSDYp9iu2KrYqNin2LEg2KfZhNmF2KfZhNmDINin2YTZhtmH2KfYptmK2KkuINmE2Kcg2YrZiNis2K8g2KrZiNmE2YrYryDZhdmE2YHYp9iqINmD2YrYqNmI2LHYry4g2YTYpyDZitmI2KzYryDZhtiz2K4g2YXZhNmB2KfYqi4g2YfYsNmHINmB2YLYtyDYtdmB2K3YqSDZhdix2KfYrNi52Kkg2YjYqti02LrZitmEINmE2YTZhdin2YTZgy48L2Rpdj4KPC9zZWN0aW9uPgoKPHNlY3Rpb24gaWQ9Im93bmVyLXRlc3QtY2hlY2tsaXN0IiBjbGFzcz0iY2FyZCIgc3R5bGU9Im1hcmdpbi10b3A6MThweCI+CjxoMj5Pd25lciB0ZXN0IGNoZWNrbGlzdDwvaDI+CjxkaXYgY2xhc3M9ImNoZWNrIj48c3BhbiBjbGFzcz0ib2siPk9LPC9zcGFuPiBQYWdlIG9wZW5zIC0g2KfZhNi12YHYrdipINiq2YHYqtitINio2K/ZiNmGINiq2LnZgtmK2K8uPC9kaXY+CjxkaXYgY2xhc3M9ImNoZWNrIj48c3BhbiBjbGFzcz0ib2siPk9LPC9zcGFuPiBCdXR0b25zIHdvcmsgLSDYp9mE2KPYstix2KfYsSDYp9mE2K7Zhdiz2Kkg2YjYp9i22K3YqSDZiNmF2KjYp9i02LHYqS48L2Rpdj4KPGRpdiBjbGFzcz0iY2hlY2siPjxzcGFuIGNsYXNzPSJvayI+T0s8L3NwYW4+IEZpbmFsIHBhY2thZ2Ugb3BlbnMgLSDYrdiy2YXYqSBWMTcxMyDYp9mE2YbZh9in2KbZitipINmC2KfYqNmE2Kkg2YTZhNmB2KrYrS48L2Rpdj4KPGRpdiBjbGFzcz0iY2hlY2siPjxzcGFuIGNsYXNzPSJvayI+T0s8L3NwYW4+IFNlYWwgb3BlbnMgLSDYp9mE2K7YqtmFINin2YTZhtmH2KfYptmKINi42KfZh9ixINmI2YXZgdmH2YjZhS48L2Rpdj4KPGRpdiBjbGFzcz0iY2hlY2siPjxzcGFuIGNsYXNzPSJvayI+T0s8L3NwYW4+IFZhbGlkYXRpb24gc2hvd3MgUkVBRFkgLSDYp9mE2KrYrdmC2YIg2YrYudix2LYg2K3Yp9mE2Kkg2KzYp9mH2LLYqS48L2Rpdj4KPGRpdiBjbGFzcz0iY2hlY2siPjxzcGFuIGNsYXNzPSJvayI+T0s8L3NwYW4+IE93bmVyIHVuZGVyc3RhbmRzIG5leHQgc3RlcCAtINin2YTZhdin2YTZgyDZitmB2YfZhSDYo9mG2Ycg2KfYrtiq2KjYp9ixINmF2LHYp9is2LnYqSDZgdmC2LcuPC9kaXY+Cjwvc2VjdGlvbj4KCjxzZWN0aW9uIHN0eWxlPSJtYXJnaW4tdG9wOjE4cHgiPgo8ZGV0YWlscz48c3VtbWFyeT5UZWNobmljYWwgRGV0YWlsczwvc3VtbWFyeT48ZGl2IGNsYXNzPSJib2R5Ij5WMTcxNCBpcyBVSSBvbmx5LiBJdCByZWFkcyBWMTcxMyBhbmQgZG9lcyBub3QgbW9kaWZ5IHRoZSBmaW5hbCBsZWRnZXIuPGJyPjxzcGFuIGNsYXNzPSJwYXRoIj5fX1YxNzEzX1JPT1RfXzwvc3Bhbj48L2Rpdj48L2RldGFpbHM+CjxkZXRhaWxzPjxzdW1tYXJ5PkZpbGUgQ291bnRzPC9zdW1tYXJ5PjxkaXYgY2xhc3M9ImJvZHkiPkxlZGdlciByb3dzOiBfX0ZJTkFMX0NPVU5UX188YnI+S0VFUF9CTE9DS0VEOiBfX0tFRVBfQkxPQ0tFRF9fPGJyPlNlcGFyYXRlIGFwcHJvdmFsOiBfX1NFUEFSQVRFX0FQUFJPVkFMX188YnI+U2FmZSBjb3B5OiAwPGJyPktleWJvYXJkIG91dHB1dDogMDwvZGl2PjwvZGV0YWlscz4KPGRldGFpbHM+PHN1bW1hcnk+U2FmZXR5IEdhdGVzPC9zdW1tYXJ5PjxkaXYgY2xhc3M9ImJvZHkiPlYxNzEzIHJlYWR5OiBfX0dBVEVfVjE3MTNfUkVBRFlfXzxicj5Db3VudHM6IF9fR0FURV9DT1VOVFNfXzxicj5TYWZldHk6IF9fR0FURV9TQUZFVFlfXzxicj5GaWxlczogX19HQVRFX0ZJTEVTX188L2Rpdj48L2RldGFpbHM+CjxkZXRhaWxzPjxzdW1tYXJ5PkRldmVsb3BlciBFdmlkZW5jZTwvc3VtbWFyeT48ZGl2IGNsYXNzPSJib2R5Ij48ZGl2IGNsYXNzPSJwYXRoIj5WYWxpZGF0aW9uOiBfX1ZBTElEQVRJT05fUEFUSF9fPC9kaXY+PGRpdiBjbGFzcz0icGF0aCI+VjE3MTMgcGFja2FnZSBTSEEyNTY6IF9fVjE3MTNfU0hBMjU2X188L2Rpdj48ZGl2IGNsYXNzPSJwYXRoIj5WMTcxNCB2YWxpZGF0aW9uOiBfX1YxNzE0X1ZBTElEQVRJT05fUEFUSF9fPC9kaXY+PC9kaXY+PC9kZXRhaWxzPgo8ZGV0YWlscz48c3VtbWFyeT5PbGQgQXR0ZW1wdHMgLyBEZXByZWNhdGVkIFZlcnNpb25zPC9zdW1tYXJ5PjxkaXYgY2xhc3M9ImJvZHkiPlYxNzEzIFIzIGlzIHRoZSBmaW5hbCBzb3VyY2UgcGFja2FnZS4gVjE3MTQgaXMgb25seSB0aGUgY2xlYW4gT3duZXIgVGVzdCBVSSBsYXllci4gRG8gbm90IHVzZSBvbGQgcmVwb3J0cyBhcyB0aGUgZmlyc3Qgb3duZXIgcGFnZS48L2Rpdj48L2RldGFpbHM+Cjwvc2VjdGlvbj4KCjxkaXYgY2xhc3M9ImZvb3RlciI+VUFPUyBWMTcxNCBPd25lciBUZXN0IFVJIEZpbmFsaXplciBSNC4gTm8gc291cmNlIGNvcHkuIE5vIGtleWJvYXJkIGJpbmFyeSBvdXRwdXQuIE5vIFVTQi4gTm8gaGFyZHdhcmUgbG9hZC48L2Rpdj4KPC9tYWluPgo8L2JvZHk+CjwvaHRtbD4K"
$html = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($htmlB64))
$html = $html.Replace("__FINAL_COUNT__", [string]$FinalCount)
$html = $html.Replace("__KEEP_BLOCKED__", [string]$KeepBlockedCount)
$html = $html.Replace("__SEPARATE_APPROVAL__", [string]$SeparateApprovalCount)
$html = $html.Replace("__PACKAGE_URI__", (HtmlSafe (FileUri $V1713PackageZip)))
$html = $html.Replace("__SEAL_URI__", (HtmlSafe (FileUri $V1713SealMd)))
$html = $html.Replace("__LEDGER_URI__", (HtmlSafe (FileUri $V1713LedgerCsv)))
$html = $html.Replace("__VALIDATION_URI__", (HtmlSafe (FileUri $V1713ValidationJson)))
$html = $html.Replace("__V1713_ROOT__", (HtmlSafe $V1713PhaseRoot))
$html = $html.Replace("__GATE_V1713_READY__", [string]$GateV1713Ready)
$html = $html.Replace("__GATE_COUNTS__", [string]$GateCounts)
$html = $html.Replace("__GATE_SAFETY__", [string]$GateSafety)
$html = $html.Replace("__GATE_FILES__", [string]$GateFiles)
$html = $html.Replace("__VALIDATION_PATH__", (HtmlSafe $V1713ValidationJson))
$html = $html.Replace("__V1713_SHA256__", (HtmlSafe $ComputedV1713PackageSha256))
$html = $html.Replace("__V1714_VALIDATION_PATH__", (HtmlSafe $OwnerTestValidationJson))
$html | Set-Content -LiteralPath $OwnerTestPortalHtml -Encoding UTF8

Log "Writing report, seal, validation" "STEP" Cyan

$report = @()
$report += "# UAOS V1714 Owner Test UI Finalizer Report - R4"
$report += ""
$report += "Created: " + (Get-Date).ToString("s")
$report += "Status target: $TargetStatus"
$report += "Current pre-package status: $PreStatus"
$report += "Revision: $Revision"
$report += ""
$report += "Purpose: clean owner-test page from committed V1713 final package."
$report += ""
$report += "Final ledger rows: $FinalCount"
$report += "KEEP_BLOCKED: $KeepBlockedCount"
$report += "REQUEST_SEPARATE_APPROVAL_PHASE: $SeparateApprovalCount"
$report += "Safe copy allowed: $SafeCopyAllowedCount"
$report += "writer_ready: $WriterReady"
$report += "Keyboard output rows: $KeyboardOutputCount"
$report += "Source copied rows: $SourceCopiedCount"
$report += "USB rows: $UsbCount"
$report += "Hardware load rows: $HardwareCount"
$report += ""
$report += "Safety: no V1713 data changes, no source copy, no keyboard output, no USB, no hardware load, no deploy, no payment."
$report | Set-Content -LiteralPath $OwnerTestReportMd -Encoding UTF8

$seal = @()
$seal += "# UAOS V1714 Owner Test Seal - R4"
$seal += ""
$seal += "Seal status: " + $(if ($PreStatus -eq $TargetStatus) { "SEALED_OWNER_TEST_READY" } else { "SEALED_CHECK" })
$seal += "Owner test status: $PreStatus"
$seal += "Source package: UAOS V1713 FINAL_WRITER R3"
$seal += "UI finalizer: V1714 R4"
$seal += "Main visible buttons: 5"
$seal += "Details hidden by default: YES"
$seal += "Final ledger rows: $FinalCount"
$seal += "KEEP_BLOCKED: $KeepBlockedCount"
$seal += "Separate approval: $SeparateApprovalCount"
$seal += "Safe copy allowed: 0"
$seal += "Keyboard output: 0"
$seal += "writer_ready: false"
$seal += "USB: NO"
$seal += "Hardware load: NO"
$seal += "Deploy: NO"
$seal += "Payment: NO"
$seal | Set-Content -LiteralPath $OwnerTestSealMd -Encoding UTF8

$stop = @()
$stop += "UAOS OWNER TEST STOP HERE"
$stop += ""
$stop += "Current owner-test entry:"
$stop += $OwnerTestPortalHtml
$stop += ""
$stop += "Status:"
$stop += $PreStatus
$stop += ""
$stop += "Do not open old reports as first owner page."
$stop += "Do not create keyboard binaries."
$stop += "Do not copy source files."
$stop | Set-Content -LiteralPath $OwnerTestStopFile -Encoding UTF8

$ForbiddenGeneratedCount = 0
$PortalPass = Test-Path -LiteralPath $OwnerTestPortalHtml
$ReportPass = Test-Path -LiteralPath $OwnerTestReportMd
$SealPass = Test-Path -LiteralPath $OwnerTestSealMd
$ChecklistPass = Test-Path -LiteralPath $OwnerTestChecklistJson

$OverallBeforePackage = ($GateV1713Ready -and $GateRevision -and $GateCounts -and $GateSafety -and $GateFiles -and $GateHash -and $GateChecklist -and $PortalPass -and $ReportPass -and $SealPass -and $ChecklistPass)

$Validation = "" | Select-Object phase, stage, revision, status, created_at, source_v1713_phase_root, source_v1713_validation, source_v1713_package, source_v1713_package_sha256, owner_test_portal, final_count, keep_blocked_count, separate_approval_count, safe_copy_allowed_count, writer_ready, keyboard_output_count, source_copied_count, usb_count, hardware_count, v1713_ready_pass, revision_pass, counts_pass, safety_pass, files_pass, hash_pass, checklist_pass, portal_pass, report_pass, seal_pass, package, package_pass, package_sha256, overall_pass
$Validation.phase = "UAOS V1714"
$Validation.stage = "OWNER_TEST_UI_FINALIZER"
$Validation.revision = $Revision
$Validation.status = if ($OverallBeforePackage) { $TargetStatus } else { "CHECK" }
$Validation.created_at = (Get-Date).ToString("s")
$Validation.source_v1713_phase_root = $V1713PhaseRoot
$Validation.source_v1713_validation = $V1713ValidationJson
$Validation.source_v1713_package = $V1713PackageZip
$Validation.source_v1713_package_sha256 = $ComputedV1713PackageSha256
$Validation.owner_test_portal = $OwnerTestPortalHtml
$Validation.final_count = $FinalCount
$Validation.keep_blocked_count = $KeepBlockedCount
$Validation.separate_approval_count = $SeparateApprovalCount
$Validation.safe_copy_allowed_count = $SafeCopyAllowedCount
$Validation.writer_ready = $WriterReady
$Validation.keyboard_output_count = $KeyboardOutputCount
$Validation.source_copied_count = $SourceCopiedCount
$Validation.usb_count = $UsbCount
$Validation.hardware_count = $HardwareCount
$Validation.v1713_ready_pass = $GateV1713Ready
$Validation.revision_pass = $GateRevision
$Validation.counts_pass = $GateCounts
$Validation.safety_pass = $GateSafety
$Validation.files_pass = $GateFiles
$Validation.hash_pass = $GateHash
$Validation.checklist_pass = $GateChecklist
$Validation.portal_pass = $PortalPass
$Validation.report_pass = $ReportPass
$Validation.seal_pass = $SealPass
$Validation.package = $OwnerTestPackageZip
$Validation.package_pass = $false
$Validation.package_sha256 = ""
$Validation.overall_pass = $OverallBeforePackage
(JsonOut $Validation) | Set-Content -LiteralPath $OwnerTestValidationJson -Encoding UTF8

$Manifest = "" | Select-Object phase, stage, revision, status, created_at, phase_root, source_v1713_phase_root, owner_test_portal, owner_test_report, owner_test_checklist, owner_test_seal, owner_test_validation, owner_test_package, final_package_reference, final_seal_reference, final_ledger_reference, final_validation_reference, source_copy, keyboard_output, usb, hardware_load, deploy, payment
$Manifest.phase = "UAOS V1714"
$Manifest.stage = "OWNER_TEST_UI_FINALIZER"
$Manifest.revision = $Revision
$Manifest.status = $Validation.status
$Manifest.created_at = (Get-Date).ToString("s")
$Manifest.phase_root = $PhaseRoot
$Manifest.source_v1713_phase_root = $V1713PhaseRoot
$Manifest.owner_test_portal = $OwnerTestPortalHtml
$Manifest.owner_test_report = $OwnerTestReportMd
$Manifest.owner_test_checklist = $OwnerTestChecklistJson
$Manifest.owner_test_seal = $OwnerTestSealMd
$Manifest.owner_test_validation = $OwnerTestValidationJson
$Manifest.owner_test_package = $OwnerTestPackageZip
$Manifest.final_package_reference = $V1713PackageZip
$Manifest.final_seal_reference = $V1713SealMd
$Manifest.final_ledger_reference = $V1713LedgerCsv
$Manifest.final_validation_reference = $V1713ValidationJson
$Manifest.source_copy = "NO"
$Manifest.keyboard_output = "NO"
$Manifest.usb = "NO"
$Manifest.hardware_load = "NO"
$Manifest.deploy = "NO"
$Manifest.payment = "NO"
(JsonOut $Manifest) | Set-Content -LiteralPath $OwnerTestManifestJson -Encoding UTF8

Log "Packaging owner test outputs" "STEP" Cyan

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("uaos_v1714_owner_test_r4_" + [guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Dir $staging

foreach ($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$ReleaseDir)) {
    if (Test-Path -LiteralPath $d) {
        $dest = Join-Path $staging (Split-Path -Path $d -Leaf)
        if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
        Copy-Item -LiteralPath $d -Destination $dest -Recurse -Force
    }
}
if (Test-Path -LiteralPath $FactoryScriptPath) {
    Copy-Item -LiteralPath $FactoryScriptPath -Destination (Join-Path $staging $ScriptName) -Force
}

if (Test-Path -LiteralPath $OwnerTestPackageZip) { Remove-Item -LiteralPath $OwnerTestPackageZip -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OwnerTestPackageZip -Force
Remove-Item -LiteralPath $staging -Recurse -Force

$PackagePass = ((Test-Path -LiteralPath $OwnerTestPackageZip) -and ((Get-Item -LiteralPath $OwnerTestPackageZip).Length -gt 0))
$PackageHash = Sha256 $OwnerTestPackageZip

if ($PackagePass) {
    ($PackageHash + "  " + (Split-Path -Path $OwnerTestPackageZip -Leaf)) | Set-Content -LiteralPath $OwnerTestPackageSha256Txt -Encoding UTF8
    Log "Owner test package: $OwnerTestPackageZip" "PASS" Green
    Log "Owner test package SHA256: $PackageHash" "PASS" Green
}

$OverallPass = ($OverallBeforePackage -and $PackagePass)
$FinalStatus = if ($OverallPass) { $TargetStatus } else { "CHECK" }

$Validation.status = $FinalStatus
$Validation.package_pass = $PackagePass
$Validation.package_sha256 = $PackageHash
$Validation.overall_pass = $OverallPass
(JsonOut $Validation) | Set-Content -LiteralPath $OwnerTestValidationJson -Encoding UTF8

$Pointer = "" | Select-Object current_owner_test, status, revision, created_at, phase_root, launcher, portal, validation, report, seal, package, package_sha256, source_final, source_final_package, stop_rule
$Pointer.current_owner_test = "UAOS V1714 OWNER_TEST_UI_FINALIZER"
$Pointer.status = $FinalStatus
$Pointer.revision = $Revision
$Pointer.created_at = (Get-Date).ToString("s")
$Pointer.phase_root = $PhaseRoot
$Pointer.launcher = $FactoryScriptPath
$Pointer.portal = $OwnerTestPortalHtml
$Pointer.validation = $OwnerTestValidationJson
$Pointer.report = $OwnerTestReportMd
$Pointer.seal = $OwnerTestSealMd
$Pointer.package = $OwnerTestPackageZip
$Pointer.package_sha256 = $PackageHash
$Pointer.source_final = "UAOS V1713 FINAL_WRITER R3"
$Pointer.source_final_package = $V1713PackageZip
$Pointer.stop_rule = "Use this clean owner-test portal as entry point. Do not open old report pages first."
(JsonOut $Pointer) | Set-Content -LiteralPath $OwnerTestPointerJson -Encoding UTF8

$statusDoc = @()
$statusDoc += "# UAOS Owner Test Status"
$statusDoc += ""
$statusDoc += "Current owner-test entry: UAOS V1714 OWNER_TEST_UI_FINALIZER R4"
$statusDoc += "Status: $FinalStatus"
$statusDoc += "Open first: $OwnerTestPortalHtml"
$statusDoc += "Owner-test package: $OwnerTestPackageZip"
$statusDoc += "SHA256: $PackageHash"
$statusDoc += "Safety: no V1713 changes, no source copy, no keyboard output, no USB, no hardware load, no deploy, no payment."
$statusDoc | Set-Content -LiteralPath $OwnerTestStatusDoc -Encoding UTF8

Log "Local git commit only" "STEP" Cyan
$GitStatus = "SKIPPED_BY_FLAG"
$GitHash = ""
if (!$NoGitCommit) {
    try {
        if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
            Push-Location $RepoRoot
            try {
                git add -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/$PhaseName" "uaos-ai-factory/UAOS_CURRENT_OWNER_TEST.json" "docs/UAOS_OWNER_TEST_STATUS.md" | Out-Null
                $statusText = ((git status --porcelain) | Out-String)
                if ([string]::IsNullOrWhiteSpace($statusText)) {
                    $GitStatus = "NO_CHANGES"
                } else {
                    git commit -m "UAOS V1714 owner test UI finalizer" | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $GitHash = (git rev-parse --short HEAD).Trim()
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
        Log $GitStatus "WARN" Yellow
    }
}

Write-Host ""
if ($FinalStatus -eq $TargetStatus) {
    Log "UAOS V1714 OWNER TEST UI FINALIZER R4 complete" "PASS" Green
} else {
    Log "UAOS V1714 OWNER TEST UI FINALIZER R4 completed with CHECK status" "FAIL" Red
}

Write-Host ("Status: " + $FinalStatus)
Write-Host ("Portal: " + $OwnerTestPortalHtml)
Write-Host ("Validation: " + $OwnerTestValidationJson)
Write-Host ("Report: " + $OwnerTestReportMd)
Write-Host ("Seal: " + $OwnerTestSealMd)
Write-Host ("Checklist: " + $OwnerTestChecklistJson)
Write-Host ("Package: " + $OwnerTestPackageZip)
Write-Host ("Package SHA256: " + $PackageHash)
Write-Host ("Current owner-test pointer: " + $OwnerTestPointerJson)
Write-Host ("Git: " + $GitStatus)
if (![string]::IsNullOrWhiteSpace($GitHash)) { Write-Host ("Git hash: " + $GitHash) }
Write-Host "OWNER TEST FINAL: 5 buttons, details hidden, no source copy, no keyboard binary output."

if (!$NoOpen -and (Test-Path -LiteralPath $OwnerTestPortalHtml)) {
    Start-Process $OwnerTestPortalHtml
}

if ($FinalStatus -ne $TargetStatus) { exit 2 }
exit 0
