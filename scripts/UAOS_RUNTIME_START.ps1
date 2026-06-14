$ErrorActionPreference = 'Stop'

$ScriptPath = $MyInvocation.MyCommand.Path
$ScriptDir = Split-Path -Parent $ScriptPath
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..')
$FrontendRoot = Join-Path $RepoRoot 'uaos-live-clean'
$ReportDir = Join-Path $RepoRoot 'reports\electron-hotfix'
$RuntimeLog = Join-Path $ReportDir 'runtime-start.log'
$ViteOutLog = Join-Path $ReportDir 'vite.out.log'
$ViteErrLog = Join-Path $ReportDir 'vite.err.log'
$ElectronOutLog = Join-Path $ReportDir 'electron-launch.out.log'
$ElectronErrLog = Join-Path $ReportDir 'electron-launch.err.log'
$AgentsOutLog = Join-Path $ReportDir 'agents.out.log'
$AgentsErrLog = Join-Path $ReportDir 'agents.err.log'
$DevUrl = 'http://127.0.0.1:5173'

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

function Write-Log {
  param([string]$Message)
  $Line = "[{0}] {1}" -f (Get-Date).ToString('s'), $Message
  Add-Content -LiteralPath $RuntimeLog -Value $Line -Encoding utf8
  Write-Host $Line
}

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required but was not found on PATH."
  }
}

function Wait-For-Http {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $Deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  } while ((Get-Date) -lt $Deadline)

  throw "Timed out waiting for $Url"
}

Set-Location -LiteralPath $RepoRoot
Write-Log "Repo root: $RepoRoot"
Write-Log "Frontend root: $FrontendRoot"

Require-Command node
Require-Command npm
$NpmCommand = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $NpmCommand) {
  $NpmCommand = (Get-Command npm).Source
}

if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot 'package.json'))) {
  throw 'Root package.json is missing.'
}

if (-not (Test-Path -LiteralPath (Join-Path $FrontendRoot 'package.json'))) {
  throw 'Frontend package.json is missing.'
}

$NeedsInstall = -not (Test-Path -LiteralPath (Join-Path $RepoRoot 'node_modules\electron')) -or
  -not (Test-Path -LiteralPath (Join-Path $FrontendRoot 'node_modules\vite')) -or
  -not (Test-Path -LiteralPath (Join-Path $FrontendRoot 'node_modules\react'))

if ($NeedsInstall) {
  Write-Log 'Installing missing npm dependencies.'
  & $NpmCommand install
  & $NpmCommand install --prefix $FrontendRoot
} else {
  Write-Log 'Required node_modules are already present.'
}

Write-Log 'Building frontend.'
& $NpmCommand run build

Write-Log 'Starting Vite on 127.0.0.1:5173.'
$ViteProcess = Start-Process $NpmCommand -ArgumentList @('run','dev','--prefix',$FrontendRoot) -WorkingDirectory $RepoRoot -RedirectStandardOutput $ViteOutLog -RedirectStandardError $ViteErrLog -PassThru -WindowStyle Hidden
Write-Log "Vite PID: $($ViteProcess.Id)"

Wait-For-Http -Url $DevUrl -TimeoutSeconds 90
Write-Log "Vite responded at $DevUrl"

$AgentsScript = Join-Path $RepoRoot 'UAOS_START_ALL_LOCAL.ps1'
if (Test-Path -LiteralPath $AgentsScript) {
  Write-Log 'Starting optional local agents script in a separate process.'
  Start-Process powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$AgentsScript) -WorkingDirectory $RepoRoot -RedirectStandardOutput $AgentsOutLog -RedirectStandardError $AgentsErrLog -WindowStyle Hidden | Out-Null
}

$env:UAOS_DEV_URL = $DevUrl
Write-Log 'Starting Electron from repo root.'
$ElectronProcess = Start-Process $NpmCommand -ArgumentList @('run','electron:start') -WorkingDirectory $RepoRoot -RedirectStandardOutput $ElectronOutLog -RedirectStandardError $ElectronErrLog -PassThru -WindowStyle Hidden
Write-Log "Electron launcher PID: $($ElectronProcess.Id)"
Write-Log 'Runtime launcher completed startup sequence.'
