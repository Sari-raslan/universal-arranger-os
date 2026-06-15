[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$SkipTests,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root "uaos-live-clean"
$Reports = Join-Path $Root "reports"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $Reports "UAOS_PHASE12_FIXED_$Stamp.log"

New-Item -ItemType Directory -Force $Reports | Out-Null

function Log {
    param(
        [string]$Message,
        [ValidateSet("INFO","PASS","WARN","FAIL")]
        [string]$Level = "INFO"
    )

    $Line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')][$Level] $Message"

    switch ($Level) {
        "PASS" { Write-Host $Line -ForegroundColor Green }
        "WARN" { Write-Host $Line -ForegroundColor Yellow }
        "FAIL" { Write-Host $Line -ForegroundColor Red }
        default { Write-Host $Line -ForegroundColor Cyan }
    }

    $Line | Out-File -LiteralPath $Log -Append -Encoding utf8
}

function Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$Optional
    )

    Log "START: $Name"

    try {
        & $Action
        Log "PASS: $Name" "PASS"
        return $true
    }
    catch {
        if ($Optional) {
            Log "OPTIONAL FAILED: $Name :: $($_.Exception.Message)" "WARN"
            return $false
        }

        Log "FAILED: $Name :: $($_.Exception.Message)" "FAIL"
        throw
    }
}

function Write-LinesNoBom {
    param(
        [string]$Path,
        [string[]]$Lines
    )

    $Parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Force $Parent | Out-Null

    $Text = $Lines -join [Environment]::NewLine
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    [System.IO.File]::WriteAllText(
        $Path,
        $Text + [Environment]::NewLine,
        $Utf8NoBom
    )
}

function Add-Existing {
    param([string]$RelativePath)

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        git add -- $RelativePath

        if ($LASTEXITCODE -ne 0) {
            throw "git add failed for $RelativePath"
        }

        Log "Staged: $RelativePath"
    }
    else {
        Log "Missing path skipped: $RelativePath" "WARN"
    }
}

Set-Location $Root

if (-not (Test-Path ".git")) {
    throw "Git repository not found: $Root"
}

if (-not (Test-Path (Join-Path $App "package.json"))) {
    throw "Application not found: $App"
}

Log "======================================================"
Log "UAOS PHASE 12 FIXED CONTINUATION"
Log "Root: $Root"
Log "======================================================"

Step "Clear stale Git lock" {
    $RunningGit = Get-Process git,git-lfs -ErrorAction SilentlyContinue

    if ($RunningGit) {
        throw "A Git process is still running."
    }

    if (Test-Path ".git\index.lock") {
        Remove-Item ".git\index.lock" -Force
        Log "Removed .git/index.lock."
    }
}

$Branch = git branch --show-current

if (-not $Branch) {
    throw "Current Git branch could not be detected."
}

Log "Current branch: $Branch" "PASS"

if ($Branch -eq "master") {
    $Branch = "codex/uaos-phase12-$Stamp"

    Step "Create safe development branch" {
        git switch -c $Branch

        if ($LASTEXITCODE -ne 0) {
            throw "Could not create branch $Branch"
        }
    }
}

Step "Update gitignore" {
    $IgnorePath = Join-Path $Root ".gitignore"

    if (-not (Test-Path $IgnorePath)) {
        New-Item -ItemType File -Path $IgnorePath -Force | Out-Null
    }

    $Rules = @(
        "*.bak",
        "*.before-*.bak",
        "reports/*.log",
        "reports/uaos-preview.pid",
        "node_modules/",
        "uaos-live-clean/dist/"
    )

    $Existing = @(Get-Content $IgnorePath -ErrorAction SilentlyContinue)

    foreach ($Rule in $Rules) {
        if ($Existing -notcontains $Rule) {
            Add-Content -LiteralPath $IgnorePath -Value $Rule -Encoding utf8
            Log "Added ignore rule: $Rule"
        }
    }
}

# ======================================================
# PHASE 12: DAW TRANSPORT
# ======================================================

$TransportPath = Join-Path $App "src\daw\transportEngine.js"

if (-not (Test-Path $TransportPath)) {
    Step "Create DAW transport engine" {
        $Lines = @(
            'const VALID_STATES = new Set([',
            '  "stopped",',
            '  "playing",',
            '  "paused",',
            '  "recording",',
            ']);',
            '',
            'export function createTransport(options = {}) {',
            '  const tempo = Number(options.tempo ?? 120);',
            '',
            '  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {',
            '    throw new RangeError("Tempo must be between 20 and 400 BPM.");',
            '  }',
            '',
            '  return {',
            '    state: "stopped",',
            '    tempo,',
            '    timeSignature: options.timeSignature ?? "4/4",',
            '    positionBeats: 0,',
            '    loopEnabled: false,',
            '    loopStartBeats: 0,',
            '    loopEndBeats: 16,',
            '    updatedAt: new Date().toISOString(),',
            '  };',
            '}',
            '',
            'export function updateTransport(transport, patch = {}) {',
            '  if (!transport || typeof transport !== "object") {',
            '    throw new TypeError("A transport object is required.");',
            '  }',
            '',
            '  const state = patch.state ?? transport.state;',
            '',
            '  if (!VALID_STATES.has(state)) {',
            '    throw new Error("Invalid transport state: " + state);',
            '  }',
            '',
            '  const tempo = Number(patch.tempo ?? transport.tempo);',
            '',
            '  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {',
            '    throw new RangeError("Tempo must be between 20 and 400 BPM.");',
            '  }',
            '',
            '  const positionBeats = Math.max(',
            '    0,',
            '    Number(patch.positionBeats ?? transport.positionBeats),',
            '  );',
            '',
            '  return {',
            '    ...transport,',
            '    ...patch,',
            '    state,',
            '    tempo,',
            '    positionBeats,',
            '    updatedAt: new Date().toISOString(),',
            '  };',
            '}',
            '',
            'export function beatsToSeconds(beats, tempo) {',
            '  const safeBeats = Number(beats);',
            '  const safeTempo = Number(tempo);',
            '',
            '  if (!Number.isFinite(safeBeats) || !Number.isFinite(safeTempo) || safeTempo <= 0) {',
            '    throw new TypeError("Valid beats and tempo are required.");',
            '  }',
            '',
            '  return safeBeats * (60 / safeTempo);',
            '}',
            '',
            'export function secondsToBeats(seconds, tempo) {',
            '  const safeSeconds = Number(seconds);',
            '  const safeTempo = Number(tempo);',
            '',
            '  if (!Number.isFinite(safeSeconds) || !Number.isFinite(safeTempo) || safeTempo <= 0) {',
            '    throw new TypeError("Valid seconds and tempo are required.");',
            '  }',
            '',
            '  return safeSeconds / (60 / safeTempo);',
            '}'
        )

        Write-LinesNoBom -Path $TransportPath -Lines $Lines
    }
}
else {
    Log "Transport engine already exists; preserved." "WARN"
}

# ======================================================
# PHASE 12: TIMELINE MODEL
# ======================================================

$TimelinePath = Join-Path $App "src\daw\timelineModel.js"

if (-not (Test-Path $TimelinePath)) {
    Step "Create timeline model" {
        $Lines = @(
            'function createId(prefix) {',
            '  if (globalThis.crypto?.randomUUID) {',
            '    return prefix + "-" + globalThis.crypto.randomUUID();',
            '  }',
            '',
            '  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);',
            '}',
            '',
            'export function createTrack(options = {}) {',
            '  return {',
            '    id: options.id ?? createId("track"),',
            '    name: options.name ?? "New Track",',
            '    type: options.type ?? "audio",',
            '    muted: false,',
            '    solo: false,',
            '    armed: false,',
            '    volume: 1,',
            '    pan: 0,',
            '    clips: [],',
            '  };',
            '}',
            '',
            'export function createClip(options = {}) {',
            '  const startBeats = Math.max(0, Number(options.startBeats ?? 0));',
            '  const durationBeats = Math.max(0.01, Number(options.durationBeats ?? 4));',
            '',
            '  return {',
            '    id: options.id ?? createId("clip"),',
            '    name: options.name ?? "New Clip",',
            '    type: options.type ?? "audio",',
            '    startBeats,',
            '    durationBeats,',
            '    source: options.source ?? null,',
            '    offsetBeats: Math.max(0, Number(options.offsetBeats ?? 0)),',
            '    gain: Number(options.gain ?? 1),',
            '    muted: Boolean(options.muted),',
            '  };',
            '}',
            '',
            'export function addClipToTrack(track, clip) {',
            '  if (!track || !clip) {',
            '    throw new TypeError("Track and clip are required.");',
            '  }',
            '',
            '  return {',
            '    ...track,',
            '    clips: [...(track.clips ?? []), clip].sort(',
            '      (a, b) => a.startBeats - b.startBeats,',
            '    ),',
            '  };',
            '}',
            '',
            'export function removeClipFromTrack(track, clipId) {',
            '  return {',
            '    ...track,',
            '    clips: (track.clips ?? []).filter((clip) => clip.id !== clipId),',
            '  };',
            '}'
        )

        Write-LinesNoBom -Path $TimelinePath -Lines $Lines
    }
}
else {
    Log "Timeline model already exists; preserved." "WARN"
}

# ======================================================
# PHASE 12: SAMPLER ZONE MODEL
# ======================================================

$ZonePath = Join-Path $App "src\sampler\samplerZoneModel.js"

if (-not (Test-Path $ZonePath)) {
    Step "Create sampler zone model" {
        $Lines = @(
            'export function createSamplerZone(options = {}) {',
            '  const rootKey = Number(options.rootKey ?? 60);',
            '  const lowKey = Number(options.lowKey ?? rootKey);',
            '  const highKey = Number(options.highKey ?? rootKey);',
            '  const lowVelocity = Number(options.lowVelocity ?? 1);',
            '  const highVelocity = Number(options.highVelocity ?? 127);',
            '',
            '  const values = [rootKey, lowKey, highKey, lowVelocity, highVelocity];',
            '',
            '  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 127)) {',
            '    throw new RangeError("Sampler MIDI values must be integers from 0 to 127.");',
            '  }',
            '',
            '  if (lowKey > highKey) {',
            '    throw new RangeError("lowKey cannot be greater than highKey.");',
            '  }',
            '',
            '  if (lowVelocity > highVelocity) {',
            '    throw new RangeError("lowVelocity cannot be greater than highVelocity.");',
            '  }',
            '',
            '  return {',
            '    id: options.id ?? globalThis.crypto?.randomUUID?.() ?? ("zone-" + Date.now()),',
            '    name: options.name ?? "Sampler Zone",',
            '    sampleUrl: options.sampleUrl ?? null,',
            '    rootKey,',
            '    lowKey,',
            '    highKey,',
            '    lowVelocity,',
            '    highVelocity,',
            '    gain: Number(options.gain ?? 1),',
            '    pan: Number(options.pan ?? 0),',
            '    tuneCents: Number(options.tuneCents ?? 0),',
            '    loopEnabled: Boolean(options.loopEnabled),',
            '    loopStart: Math.max(0, Number(options.loopStart ?? 0)),',
            '    loopEnd: Math.max(0, Number(options.loopEnd ?? 0)),',
            '    roundRobinGroup: options.roundRobinGroup ?? null,',
            '  };',
            '}',
            '',
            'export function matchSamplerZones(zones, note, velocity) {',
            '  const safeNote = Number(note);',
            '  const safeVelocity = Number(velocity);',
            '',
            '  return (zones ?? []).filter(',
            '    (zone) =>',
            '      safeNote >= zone.lowKey &&',
            '      safeNote <= zone.highKey &&',
            '      safeVelocity >= zone.lowVelocity &&',
            '      safeVelocity <= zone.highVelocity,',
            '  );',
            '}'
        )

        Write-LinesNoBom -Path $ZonePath -Lines $Lines
    }
}
else {
    Log "Sampler zone model already exists; preserved." "WARN"
}

# ======================================================
# PHASE 12 TESTS
# ======================================================

$TestPath = Join-Path $Root "tests\phase12-daw-sampler-foundation.test.mjs"

if (-not (Test-Path $TestPath)) {
    Step "Create Phase 12 tests" {
        $Lines = @(
            'import test from "node:test";',
            'import assert from "node:assert/strict";',
            '',
            'import {',
            '  beatsToSeconds,',
            '  createTransport,',
            '  secondsToBeats,',
            '  updateTransport,',
            '} from "../uaos-live-clean/src/daw/transportEngine.js";',
            '',
            'import {',
            '  addClipToTrack,',
            '  createClip,',
            '  createTrack,',
            '} from "../uaos-live-clean/src/daw/timelineModel.js";',
            '',
            'import {',
            '  createSamplerZone,',
            '  matchSamplerZones,',
            '} from "../uaos-live-clean/src/sampler/samplerZoneModel.js";',
            '',
            'test("transport converts beats and seconds", () => {',
            '  assert.equal(beatsToSeconds(4, 120), 2);',
            '  assert.equal(secondsToBeats(2, 120), 4);',
            '',
            '  const transport = createTransport({ tempo: 120 });',
            '  const playing = updateTransport(transport, {',
            '    state: "playing",',
            '    positionBeats: 8,',
            '  });',
            '',
            '  assert.equal(playing.state, "playing");',
            '  assert.equal(playing.positionBeats, 8);',
            '});',
            '',
            'test("timeline sorts clips by position", () => {',
            '  let track = createTrack({ name: "Audio 1" });',
            '',
            '  track = addClipToTrack(',
            '    track,',
            '    createClip({ name: "Second", startBeats: 8 }),',
            '  );',
            '',
            '  track = addClipToTrack(',
            '    track,',
            '    createClip({ name: "First", startBeats: 0 }),',
            '  );',
            '',
            '  assert.equal(track.clips.length, 2);',
            '  assert.equal(track.clips[0].name, "First");',
            '});',
            '',
            'test("sampler matches key and velocity", () => {',
            '  const zone = createSamplerZone({',
            '    lowKey: 48,',
            '    highKey: 72,',
            '    lowVelocity: 1,',
            '    highVelocity: 80,',
            '  });',
            '',
            '  assert.equal(matchSamplerZones([zone], 60, 64).length, 1);',
            '  assert.equal(matchSamplerZones([zone], 80, 64).length, 0);',
            '  assert.equal(matchSamplerZones([zone], 60, 100).length, 0);',
            '});'
        )

        Write-LinesNoBom -Path $TestPath -Lines $Lines
    }
}
else {
    Log "Phase 12 test already exists; preserved." "WARN"
}

# ======================================================
# LARGE FILE CHECK
# ======================================================

Step "Check untracked files larger than 20 MB" {
    $Large = @()
    $Untracked = git ls-files --others --exclude-standard

    foreach ($RelativePath in $Untracked) {
        $FullPath = Join-Path $Root $RelativePath

        if (Test-Path $FullPath -PathType Leaf) {
            $File = Get-Item $FullPath

            if ($File.Length -gt 20MB) {
                $Large += "$RelativePath`t$([math]::Round($File.Length / 1MB, 2)) MB"
            }
        }
    }

    $LargeReport = Join-Path $Reports "UAOS_LARGE_FILES_$Stamp.txt"

    if ($Large.Count -gt 0) {
        $Large | Set-Content -LiteralPath $LargeReport -Encoding utf8
        Log "Large files will not be staged automatically: $LargeReport" "WARN"
    }
    else {
        "No untracked files larger than 20 MB." |
            Set-Content -LiteralPath $LargeReport -Encoding utf8
    }
}

# ======================================================
# INSTALL
# ======================================================

if (-not $SkipInstall) {
    Step "Install dependencies" {
        Set-Location $App

        if (Test-Path "package-lock.json") {
            npm ci --no-audit --no-fund

            if ($LASTEXITCODE -ne 0) {
                Log "npm ci failed; trying npm install." "WARN"
                npm install --no-audit --no-fund
            }
        }
        else {
            npm install --no-audit --no-fund
        }

        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed."
        }
    }
}

# ======================================================
# TESTS
# ======================================================

if (-not $SkipTests) {
    Step "Run Phase 12 test" {
        Set-Location $Root

        node --test "tests/phase12-daw-sampler-foundation.test.mjs"

        if ($LASTEXITCODE -ne 0) {
            throw "Phase 12 test failed."
        }
    }

    Step "Run existing Node test suite" {
        Set-Location $Root

        $Tests = Get-ChildItem ".\tests" -Filter "*.test.mjs" -File

        if (-not $Tests) {
            Log "No tests found." "WARN"
            return
        }

        node --test tests/*.test.mjs

        if ($LASTEXITCODE -ne 0) {
            throw "Existing test suite failed."
        }
    } -Optional
}

# ======================================================
# BUILD
# ======================================================

Step "Build frontend" {
    Set-Location $App
    npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed."
    }

    if (-not (Test-Path ".\dist\index.html")) {
        throw "dist/index.html was not created."
    }
}

# ======================================================
# STAGE
# ======================================================

Set-Location $Root

Step "Stage Phase 12 and existing project work" {
    $Paths = @(
        ".gitignore",
        "scripts/UAOS_CONTINUE_PHASES_FIXED.ps1",
        "tests",
        "uaos-live-clean/src/ai",
        "uaos-live-clean/src/api",
        "uaos-live-clean/src/arranger",
        "uaos-live-clean/src/audio",
        "uaos-live-clean/src/components",
        "uaos-live-clean/src/daw",
        "uaos-live-clean/src/hooks",
        "uaos-live-clean/src/music",
        "uaos-live-clean/src/sampler",
        "uaos-live-clean/src/uaos-official-brand.css",
        "uaos-live-clean/public/brand",
        "uaos-live-clean/public/uaos-production-doctor.json",
        "uaos-live-clean/public/uaos-stripe-readiness.json",
        "reports/UAOS_LATEST_STATUS.md"
    )

    foreach ($Path in $Paths) {
        Add-Existing $Path
    }

    $MediaFiles = git ls-files `
        --others `
        --exclude-standard `
        -- `
        "uaos-live-clean/public/media"

    foreach ($MediaFile in $MediaFiles) {
        $FullMediaFile = Join-Path $Root $MediaFile

        if (
            (Test-Path $FullMediaFile -PathType Leaf) -and
            ((Get-Item $FullMediaFile).Length -le 20MB)
        ) {
            git add -- $MediaFile
            Log "Staged media: $MediaFile"
        }
        else {
            Log "Skipped large media: $MediaFile" "WARN"
        }
    }
}

Step "Show staged files" {
    $Staged = git diff --cached --name-only

    if (-not $Staged) {
        Log "No new staged files." "WARN"
        return
    }

    Write-Host ""
    Write-Host "STAGED FILES" -ForegroundColor Green
    $Staged

    $Staged |
        Set-Content `
            -LiteralPath (Join-Path $Reports "UAOS_STAGED_$Stamp.txt") `
            -Encoding utf8
}

Step "Commit continuation" {
    $Staged = git diff --cached --name-only

    if (-not $Staged) {
        Log "Nothing to commit." "WARN"
        return
    }

    git commit -m "Continue UAOS Phase 12 DAW sampler and production foundations"

    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed."
    }
}

# ======================================================
# REMOTE SYNC
# ======================================================

Step "Fetch remote changes" {
    git fetch origin --prune

    if ($LASTEXITCODE -ne 0) {
        throw "git fetch failed."
    }
}

git show-ref --verify --quiet "refs/remotes/origin/$Branch"
$RemoteBranchExists = ($LASTEXITCODE -eq 0)

if ($RemoteBranchExists) {
    Step "Rebase from current remote branch" {
        git pull --rebase origin $Branch

        if ($LASTEXITCODE -ne 0) {
            throw "Rebase failed. Use git rebase --abort if needed."
        }
    }
}
else {
    Log "Remote branch does not exist yet." "WARN"
}

if (-not $SkipPush) {
    Step "Push current branch" {
        git push -u origin $Branch

        if ($LASTEXITCODE -ne 0) {
            throw "Push failed. Force push was not used."
        }
    }
}

# ======================================================
# FINAL REPORT
# ======================================================

Step "Write final Phase 12 report" {
    $Commit = git rev-parse --short HEAD
    $Status = git status --short
    $ReportPath = Join-Path $Reports "UAOS_PHASE12_FIXED_STATUS.md"

    $Lines = @(
        "# UAOS Phase 12 Fixed Status",
        "",
        "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "",
        "## Branch",
        "",
        "- $Branch",
        "",
        "## Commit",
        "",
        "- $Commit",
        "",
        "## Completed",
        "",
        "- Corrected PowerShell and JavaScript generation.",
        "- Added DAW transport foundation.",
        "- Added timeline and clip model.",
        "- Added sampler zones and velocity layers.",
        "- Added automated Phase 12 tests.",
        "- Ran production frontend build.",
        "- Excluded local backup files.",
        "- Checked large assets.",
        "- Committed and pushed the current branch safely.",
        "",
        "## Remaining Git status",
        "",
        "~~~text",
        ($Status -join [Environment]::NewLine),
        "~~~"
    )

    $Lines | Set-Content -LiteralPath $ReportPath -Encoding utf8
    Log "Final report: $ReportPath" "PASS"
}

Log "======================================================"
Log "UAOS PHASE 12 FIXED CONTINUATION COMPLETED" "PASS"
Log "Branch: $Branch" "PASS"
Log "Log: $Log" "PASS"
Log "======================================================"