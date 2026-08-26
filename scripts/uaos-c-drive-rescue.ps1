# UAOS C-drive emergency rescue — safe reclaim only.
# Does not delete Documents/Desktop/Downloads/Word recovery/UAOS repositories.
# Does not force-kill processes. Does not modify Commander/Singy/Arranger source.

$ErrorActionPreference = 'Continue'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $root 'AGENTS.md'))) {
  $root = 'C:\keyboard-manager-clean'
}
$reportDir = Join-Path $root 'reports'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$reportJson = Join-Path $reportDir "C_DRIVE_EMERGENCY_RESCUE_$stamp.json"
$reportMd = Join-Path $reportDir "C_DRIVE_EMERGENCY_RESCUE_$stamp.md"

function Get-CFreeGB {
  $d = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
  [math]::Round(($d.FreeSpace / 1GB), 2)
}

function Test-ProtectedPath([string]$path) {
  $p = $path.ToLowerInvariant()
  $blocked = @(
    '\documents\',
    '\desktop\',
    '\downloads\',
    '\word recovery',
    'autorecovery',
    '~$',
    '.asd',
    '.wbk',
    '\keyboard-manager-clean\',
    '\uaos commander',
    '\uaos_agent_factory',
    '\uaos-wt\',
    '\uaos_final_programs',
    '\uaos_old_laptop_rescue',
    '\uaos_lan_transfer'
  )
  foreach ($b in $blocked) {
    if ($p.Contains($b)) { return $true }
  }
  return $false
}

function Clear-TempDir([string]$dir, [int]$olderThanHours = 12) {
  $deleted = 0L
  $bytes = 0L
  $skipped = 0
  if (-not (Test-Path -LiteralPath $dir)) {
    return [pscustomobject]@{ deleted = 0; bytes = 0; skipped = 0; path = $dir }
  }
  $cutoff = (Get-Date).AddHours(-$olderThanHours)
  Get-ChildItem -LiteralPath $dir -Force -Recurse -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer } |
    ForEach-Object {
      if (Test-ProtectedPath $_.FullName) { $skipped++; return }
      if ($_.LastWriteTime -gt $cutoff) { $skipped++; return }
      try {
        $len = $_.Length
        Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop
        $deleted++
        $bytes += $len
      } catch {
        $skipped++
      }
    }
  return [pscustomobject]@{ deleted = $deleted; bytes = $bytes; skipped = $skipped; path = $dir }
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$before = Get-CFreeGB
$actions = @()
$hibernationDisabled = $false
$hibernationNote = 'NOT_CHANGED'

# Safe cache reclaim only.
$tempUser = Clear-TempDir "$env:LOCALAPPDATA\Temp" 12
$actions += "user_temp deleted=$($tempUser.deleted) bytes=$($tempUser.bytes) skipped=$($tempUser.skipped)"

if ($isAdmin) {
  $tempWin = Clear-TempDir 'C:\Windows\Temp' 12
  $actions += "windows_temp deleted=$($tempWin.deleted) bytes=$($tempWin.bytes) skipped=$($tempWin.skipped)"
} else {
  $actions += 'windows_temp SKIPPED_NOT_ADMIN'
}

foreach ($cache in @(
    "$env:LOCALAPPDATA\npm-cache",
    "$env:LOCALAPPDATA\electron-builder\Cache",
    "$env:LOCALAPPDATA\electron\Cache"
  )) {
  if (Test-Path -LiteralPath $cache) {
    $r = Clear-TempDir $cache 0
    $actions += "cache $cache deleted=$($r.deleted) bytes=$($r.bytes)"
  }
}

if ($isAdmin) {
  try {
    $beforeHibernate = & powercfg /a 2>&1 | Out-String
    & powercfg /h off 2>&1 | Out-Null
    $hibernationDisabled = $true
    $hibernationNote = 'TEMPORARILY_DISABLED_VIA_POWERCFG_H_OFF'
    $actions += 'powercfg /h off'
    $actions += ($beforeHibernate.Trim() -replace '\s+', ' ').Substring(0, [Math]::Min(180, ($beforeHibernate.Trim() -replace '\s+', ' ').Length))
  } catch {
    $hibernationNote = "FAILED:$($_.Exception.Message)"
  }
} else {
  $hibernationNote = 'SKIPPED_NOT_ADMIN'
}

$after = Get-CFreeGB
$reclaimed = [math]::Round(($after - $before), 2)

$since = (Get-Date).AddDays(-7)
$kp = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-Kernel-Power' } -MaxEvents 8 -ErrorAction SilentlyContinue)
$kp41 = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-Kernel-Power'; Id = 41; StartTime = $since } -ErrorAction SilentlyContinue)
$whea = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WHEA-Logger' } -MaxEvents 8 -ErrorAction SilentlyContinue)
$whea7 = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WHEA-Logger'; StartTime = $since } -ErrorAction SilentlyContinue)
$ev6008 = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 6008 } -MaxEvents 8 -ErrorAction SilentlyContinue)
$bugcheck = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WER-SystemErrorReporting' } -MaxEvents 5 -ErrorAction SilentlyContinue)

function Fmt-Events($events) {
  @($events | ForEach-Object {
      $msg = if ($_.Message) { $_.Message.Substring(0, [Math]::Min(160, $_.Message.Length)) } else { '' }
      [ordered]@{ time = $_.TimeCreated.ToString('s'); id = $_.Id; message = $msg }
    })
}

$heuristic = @()
if ($before -lt 10) { $heuristic += 'C_FREE_BELOW_10GB_CRITICAL' }
elseif ($before -lt 20) { $heuristic += 'C_FREE_BELOW_20GB_LOW' }
else { $heuristic += 'C_FREE_ABOVE_20GB' }
if ($kp41.Count -gt 0) { $heuristic += "KERNEL_POWER_41_COUNT_7D=$($kp41.Count)" }
if ($whea7.Count -gt 0) { $heuristic += "WHEA_COUNT_7D=$($whea7.Count)" }
if ($bugcheck | Where-Object { $_.Message -match '0x00000124' }) { $heuristic += 'BUGCHECK_0x124_WHEA_UNCORRECTABLE' }
$heuristic += 'NOT_DISK_FULL_AS_PRIMARY_CAUSE'

$finalStatus = if ($after -lt 10) {
  'UNSAFE_BELOW_10GB_DO_NOT_RESUME_REGRESSION'
} elseif ($after -lt 20) {
  'MARGINAL_BELOW_20GB_AVOID_HEAVY_BUILD'
} else {
  'SAFE_ABOVE_20GB_REGRESSION_NOT_RESUMED_BY_INSTRUCTION'
}

$result = [ordered]@{
  schema = 'uaos.c-drive-emergency-rescue/v1'
  capturedAt = (Get-Date).ToString('o')
  isAdmin = $isAdmin
  C_FREE_BEFORE_GB = $before
  C_FREE_AFTER_GB = $after
  SPACE_RECLAIMED_GB = $reclaimed
  SHUTDOWN_HEURISTIC = ($heuristic -join '; ')
  Kernel_Power = Fmt-Events $kp
  EventLog_6008_unexpected_shutdown = Fmt-Events $ev6008
  WHEA = Fmt-Events $whea
  Bugcheck = Fmt-Events $bugcheck
  HIBERNATION_TEMPORARILY_DISABLED = $hibernationDisabled
  HIBERNATION_NOTE = $hibernationNote
  FINAL_DISK_STATUS = $finalStatus
  actions = $actions
  protected = @(
    'Documents', 'Desktop', 'Downloads', 'Word recovery files', 'UAOS repositories'
  )
  processKill = 'NONE'
  gitWorktree = 'PRESERVED_NO_CHECKOUT_NO_COMMIT_NO_SOURCE_EDIT'
  regression = 'NOT_RESUMED'
}

$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportJson -Encoding UTF8

@(
  '# UAOS C-drive emergency rescue',
  '',
  "- C_FREE_BEFORE_GB: $before",
  "- C_FREE_AFTER_GB: $after",
  "- SPACE_RECLAIMED_GB: $reclaimed",
  "- SHUTDOWN_HEURISTIC: $($result.SHUTDOWN_HEURISTIC)",
  "- HIBERNATION_TEMPORARILY_DISABLED: $hibernationDisabled ($hibernationNote)",
  "- FINAL_DISK_STATUS: $finalStatus",
  "- IS_ADMIN: $isAdmin",
  "- JSON: $reportJson"
) | Set-Content -LiteralPath $reportMd -Encoding UTF8

Write-Host "C_FREE_BEFORE_GB=$before"
Write-Host "C_FREE_AFTER_GB=$after"
Write-Host "SPACE_RECLAIMED_GB=$reclaimed"
Write-Host "SHUTDOWN_HEURISTIC=$($result.SHUTDOWN_HEURISTIC)"
Write-Host "HIBERNATION_TEMPORARILY_DISABLED=$hibernationDisabled"
Write-Host "HIBERNATION_NOTE=$hibernationNote"
Write-Host "FINAL_DISK_STATUS=$finalStatus"
Write-Host "IS_ADMIN=$isAdmin"
Write-Host "REPORT_JSON=$reportJson"
Write-Host "REPORT_MD=$reportMd"
exit 0
