$ErrorActionPreference = "Stop"

$Root = "C:\Users\ssare\keyboard-manager-clean"
$Frontend = "$Root\frontend"
$BackupDir = "C:\Users\ssare\Documents\UAOS_BACKUPS"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportDir = "$Root\reports"
$MainReport = "$ReportDir\UAOS_SAFE_AGENTS_MAIN_REPORT_$Stamp.md"

function Log($m){
  Write-Host $m
  $m | Out-File -LiteralPath $MainReport -Append -Encoding utf8
}

function BuildCheck($name){
  Log ""
  Log "## Build Check: $name"
  Set-Location $Frontend
  npm run build
  if($LASTEXITCODE -ne 0){
    throw "BUILD FAILED after $name"
  }
  Set-Location $Root
  Log "PASS: $name"
}

function WriteReport($name,$content){
  $path = "$ReportDir\$name.md"
  $content | Out-File -LiteralPath $path -Encoding utf8
  return $path
}

Set-Location $Root
New-Item -ItemType Directory -Path $BackupDir,$ReportDir -Force | Out-Null

Log "# UAOS Safe Agents Sequential Launcher"
Log "Time: $(Get-Date)"
Log "Mode: safe, no force push, no loop, no startup, no Vercel"

# 1 Backup
Log ""
Log "## Backup"
$Backup = "$BackupDir\UAOS_SAFE_AGENTS_BACKUP_$Stamp.zip"
git status --short | Out-File "$BackupDir\UAOS_SAFE_AGENTS_STATUS_BEFORE_$Stamp.txt" -Encoding utf8
Compress-Archive -Path "$Root\*" -DestinationPath $Backup -Force -CompressionLevel Fastest
Log "Backup created: $Backup"

# 2 Git clean check
Log ""
Log "## Git safety check"
$status = git status --porcelain
if($status){
  Log "STOP: Git is not clean."
  git status
  throw "Git is not clean. Clean the working tree before running."
}
Log "Git clean PASS"

# 3 Git pull
Log ""
Log "## Git pull"
git pull --ff-only origin master
if($LASTEXITCODE -ne 0){ throw "git pull failed" }
Log "Git pull PASS"

# 4 Initial build
BuildCheck "Initial"

# 5 Runtime Agent
Log ""
Log "## Runtime Agent"
New-Item -ItemType Directory -Path runtime\src -Force | Out-Null
@'
export class UaosRuntime {
  constructor() {
    this.state = {
      playing: false,
      section: "variation1",
      tempo: 120,
      chord: null,
      transportTick: 0
    };
  }

  start() { this.state.playing = true; return this.snapshot(); }
  stop() { this.state.playing = false; return this.snapshot(); }
  setTempo(tempo) { this.state.tempo = Number(tempo) || 120; return this.snapshot(); }
  setChord(chord) { this.state.chord = chord; return this.snapshot(); }
  triggerSection(section) { this.state.section = section || "variation1"; return this.snapshot(); }
  tick() { this.state.transportTick += 1; return this.snapshot(); }
  snapshot() { return { ...this.state }; }
}
