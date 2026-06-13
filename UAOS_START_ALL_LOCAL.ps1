$ErrorActionPreference = 'Continue'

$ScriptPath = $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptPath
$ReportDir = Join-Path $RepoRoot 'reports\electron-hotfix'
$LogFile = Join-Path $ReportDir 'agents.log'
$BackendRoot = Join-Path $RepoRoot 'backend'
$BackendPackage = Join-Path $BackendRoot 'package.json'

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

function Write-AgentLog {
  param([string]$Message)
  $Line = "[{0}] {1}" -f (Get-Date).ToString('s'), $Message
  Add-Content -LiteralPath $LogFile -Value $Line -Encoding utf8
  Write-Host $Line
}

Write-AgentLog "UAOS optional local agent launcher started from $RepoRoot"

$NpmCommand = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $NpmCommand -and (Get-Command npm -ErrorAction SilentlyContinue)) {
  $NpmCommand = (Get-Command npm).Source
}

if ((Test-Path -LiteralPath $BackendPackage) -and $NpmCommand) {
  try {
    $BackendOutLog = Join-Path $ReportDir 'backend.out.log'
    $BackendErrLog = Join-Path $ReportDir 'backend.err.log'
    $BackendProcess = Start-Process $NpmCommand -ArgumentList @('start') -WorkingDirectory $BackendRoot -RedirectStandardOutput $BackendOutLog -RedirectStandardError $BackendErrLog -PassThru -WindowStyle Hidden
    Write-AgentLog "Backend started as optional process PID $($BackendProcess.Id)"
  } catch {
    Write-AgentLog "Backend start failed: $($_.Exception.Message)"
  }
} else {
  Write-AgentLog 'Backend package or npm not found; skipping optional backend.'
}

$AgentScript = Join-Path $RepoRoot 'agents\uaos-autonomous-agent.ps1'
if (Test-Path -LiteralPath $AgentScript) {
  try {
    $AutonomousOutLog = Join-Path $ReportDir 'autonomous-agent.out.log'
    $AutonomousErrLog = Join-Path $ReportDir 'autonomous-agent.err.log'
    $AgentProcess = Start-Process powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$AgentScript) -WorkingDirectory $RepoRoot -RedirectStandardOutput $AutonomousOutLog -RedirectStandardError $AutonomousErrLog -PassThru -WindowStyle Hidden
    Write-AgentLog "Autonomous agent started as optional process PID $($AgentProcess.Id)"
  } catch {
    Write-AgentLog "Autonomous agent start failed: $($_.Exception.Message)"
  }
} else {
  Write-AgentLog 'Autonomous agent script not found; skipping optional agent.'
}

Write-AgentLog 'UAOS optional local agent launcher finished.'
