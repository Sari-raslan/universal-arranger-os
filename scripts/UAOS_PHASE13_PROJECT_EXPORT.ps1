[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$SkipFullTests,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root "uaos-live-clean"
$Reports = Join-Path $Root "reports"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $Reports "UAOS_PHASE13_$Stamp.log"

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

    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $Text = $Lines -join [Environment]::NewLine

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
            throw "git add failed: $RelativePath"
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

$Branch = git branch --show-current

if (-not $Branch) {
    throw "Current branch could not be detected."
}

if ($Branch -eq "master") {
    throw "Phase 13 must not run directly on master."
}

Log "======================================================"
Log "UAOS PHASE 13 â€” PROJECT MODEL AND DEVICE EXPORT"
Log "Branch: $Branch"
Log "======================================================"

Step "Remove stale Git lock" {
    $RunningGit = Get-Process git,git-lfs -ErrorAction SilentlyContinue

    if ($RunningGit) {
        throw "A Git process is still running."
    }

    if (Test-Path ".git\index.lock") {
        Remove-Item ".git\index.lock" -Force
        Log "Removed stale Git lock."
    }
}

# ======================================================
# PROJECT MODEL
# ======================================================

$ProjectModelPath = Join-Path $App "src\daw\projectModel.js"

if (-not (Test-Path $ProjectModelPath)) {
    Step "Create DAW project model" {
        $Lines = @(
            'function createId(prefix) {',
            '  if (globalThis.crypto?.randomUUID) {',
            '    return prefix + "-" + globalThis.crypto.randomUUID();',
            '  }',
            '',
            '  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);',
            '}',
            '',
            'export function createProject(options = {}) {',
            '  const tempo = Number(options.tempo ?? 120);',
            '',
            '  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {',
            '    throw new RangeError("Project tempo must be between 20 and 400 BPM.");',
            '  }',
            '',
            '  const now = new Date().toISOString();',
            '',
            '  return {',
            '    schemaVersion: 1,',
            '    id: options.id ?? createId("project"),',
            '    name: options.name ?? "Untitled UAOS Project",',
            '    tempo,',
            '    timeSignature: options.timeSignature ?? "4/4",',
            '    keySignature: options.keySignature ?? null,',
            '    tracks: Array.isArray(options.tracks) ? options.tracks : [],',
            '    markers: Array.isArray(options.markers) ? options.markers : [],',
            '    arranger: options.arranger ?? null,',
            '    metadata: {',
            '      createdAt: options.metadata?.createdAt ?? now,',
            '      updatedAt: now,',
            '      author: options.metadata?.author ?? null,',
            '      description: options.metadata?.description ?? "",',
            '    },',
            '  };',
            '}',
            '',
            'export function addTrackToProject(project, track) {',
            '  if (!project || !track) {',
            '    throw new TypeError("Project and track are required.");',
            '  }',
            '',
            '  return {',
            '    ...project,',
            '    tracks: [...(project.tracks ?? []), track],',
            '    metadata: {',
            '      ...project.metadata,',
            '      updatedAt: new Date().toISOString(),',
            '    },',
            '  };',
            '}',
            '',
            'export function removeTrackFromProject(project, trackId) {',
            '  return {',
            '    ...project,',
            '    tracks: (project.tracks ?? []).filter((track) => track.id !== trackId),',
            '    metadata: {',
            '      ...project.metadata,',
            '      updatedAt: new Date().toISOString(),',
            '    },',
            '  };',
            '}',
            '',
            'export function serializeProject(project) {',
            '  if (!project || typeof project !== "object") {',
            '    throw new TypeError("A project object is required.");',
            '  }',
            '',
            '  return JSON.stringify(project, null, 2);',
            '}',
            '',
            'export function parseProject(json) {',
            '  const project = JSON.parse(json);',
            '',
            '  if (project.schemaVersion !== 1) {',
            '    throw new Error("Unsupported UAOS project schema version.");',
            '  }',
            '',
            '  if (!Array.isArray(project.tracks)) {',
            '    throw new Error("UAOS project tracks must be an array.");',
            '  }',
            '',
            '  return project;',
            '}'
        )

        Write-LinesNoBom -Path $ProjectModelPath -Lines $Lines
    }
}
else {
    Log "Project model already exists; preserved." "WARN"
}

# ======================================================
# DEVICE EXPORT PLANNER
# ======================================================

$ExportPlannerPath = Join-Path $App "src\arranger\deviceExportPlanner.js"

if (-not (Test-Path $ExportPlannerPath)) {
    Step "Create device export planner" {
        $Lines = @(
            'const DEVICE_LIMITS = Object.freeze({',
            '  "korg-pa3x": {',
            '    manufacturer: "KORG",',
            '    model: "PA3X",',
            '    maxStyleTracks: 8,',
            '    format: "KORG_STYLE",',
            '    extensions: [".sty"],',
            '  },',
            '  "korg-pa5x": {',
            '    manufacturer: "KORG",',
            '    model: "PA5X",',
            '    maxStyleTracks: 8,',
            '    format: "KORG_STYLE",',
            '    extensions: [".sty"],',
            '  },',
            '  "yamaha-genos": {',
            '    manufacturer: "Yamaha",',
            '    model: "Genos",',
            '    maxStyleTracks: 8,',
            '    format: "YAMAHA_STYLE",',
            '    extensions: [".sty", ".prs", ".sst"],',
            '  },',
            '  "roland-bk9": {',
            '    manufacturer: "Roland",',
            '    model: "BK-9",',
            '    maxStyleTracks: 8,',
            '    format: "ROLAND_STYLE",',
            '    extensions: [".stl"],',
            '  },',
            '  "ketron-sd9": {',
            '    manufacturer: "Ketron",',
            '    model: "SD9",',
            '    maxStyleTracks: 8,',
            '    format: "KETRON_STYLE",',
            '    extensions: [".pat"],',
            '  },',
            '});',
            '',
            'export function getExportDevice(deviceId) {',
            '  return DEVICE_LIMITS[String(deviceId).toLowerCase()] ?? null;',
            '}',
            '',
            'export function classifyTrack(track = {}) {',
            '  const name = String(track.name ?? "").toLowerCase();',
            '  const role = String(track.role ?? "").toLowerCase();',
            '  const source = role || name;',
            '',
            '  if (source.includes("drum") || source.includes("perc")) return "drums";',
            '  if (source.includes("bass")) return "bass";',
            '  if (source.includes("chord")) return "chord";',
            '  if (source.includes("pad")) return "pad";',
            '  if (source.includes("phrase")) return "phrase";',
            '',
            '  return "other";',
            '}',
            '',
            'export function validateProjectForDevice(project, deviceId) {',
            '  const device = getExportDevice(deviceId);',
            '',
            '  if (!device) {',
            '    return {',
            '      ok: false,',
            '      errors: ["Unsupported export device: " + deviceId],',
            '      warnings: [],',
            '      device: null,',
            '    };',
            '  }',
            '',
            '  const tracks = Array.isArray(project?.tracks) ? project.tracks : [];',
            '  const errors = [];',
            '  const warnings = [];',
            '',
            '  if (tracks.length === 0) {',
            '    errors.push("Project has no tracks.");',
            '  }',
            '',
            '  if (tracks.length > device.maxStyleTracks) {',
            '    errors.push(',
            '      "Project has " + tracks.length +',
            '      " tracks, but " + device.model +',
            '      " supports " + device.maxStyleTracks +',
            '      " style tracks in this export profile.",',
            '    );',
            '  }',
            '',
            '  const classified = tracks.map((track) => ({',
            '    id: track.id ?? null,',
            '    name: track.name ?? "Unnamed Track",',
            '    role: classifyTrack(track),',
            '  }));',
            '',
            '  if (!classified.some((track) => track.role === "drums")) {',
            '    warnings.push("No drum track was detected.");',
            '  }',
            '',
            '  if (!classified.some((track) => track.role === "bass")) {',
            '    warnings.push("No bass track was detected.");',
            '  }',
            '',
            '  return {',
            '    ok: errors.length === 0,',
            '    device,',
            '    errors,',
            '    warnings,',
            '    tracks: classified,',
            '  };',
            '}',
            '',
            'export function createDeviceExportPlan(project, deviceId) {',
            '  const validation = validateProjectForDevice(project, deviceId);',
            '',
            '  if (!validation.ok) {',
            '    return {',
            '      ok: false,',
            '      validation,',
            '      plan: null,',
            '    };',
            '  }',
            '',
            '  return {',
            '    ok: true,',
            '    validation,',
            '    plan: {',
            '      deviceId,',
            '      format: validation.device.format,',
            '      suggestedExtension: validation.device.extensions[0],',
            '      projectName: project.name ?? "UAOS Export",',
            '      tempo: project.tempo ?? 120,',
            '      timeSignature: project.timeSignature ?? "4/4",',
            '      tracks: validation.tracks.map((track, index) => ({',
            '        slot: index + 1,',
            '        ...track,',
            '      })),',
            '      generatedAt: new Date().toISOString(),',
            '      status: "planning-only",',
            '    },',
            '  };',
            '}'
        )

        Write-LinesNoBom -Path $ExportPlannerPath -Lines $Lines
    }
}
else {
    Log "Device export planner already exists; preserved." "WARN"
}

# ======================================================
# PHASE 13 TESTS
# ======================================================

$TestPath = Join-Path $Root "tests\phase13-project-export.test.mjs"

if (-not (Test-Path $TestPath)) {
    Step "Create Phase 13 tests" {
        $Lines = @(
            'import test from "node:test";',
            'import assert from "node:assert/strict";',
            '',
            'import {',
            '  addTrackToProject,',
            '  createProject,',
            '  parseProject,',
            '  serializeProject,',
            '} from "../uaos-live-clean/src/daw/projectModel.js";',
            '',
            'import {',
            '  createDeviceExportPlan,',
            '  validateProjectForDevice,',
            '} from "../uaos-live-clean/src/arranger/deviceExportPlanner.js";',
            '',
            'test("UAOS project serializes and parses", () => {',
            '  let project = createProject({',
            '    name: "Test Project",',
            '    tempo: 100,',
            '  });',
            '',
            '  project = addTrackToProject(project, {',
            '    id: "track-1",',
            '    name: "Drums",',
            '    role: "drums",',
            '  });',
            '',
            '  const parsed = parseProject(serializeProject(project));',
            '',
            '  assert.equal(parsed.name, "Test Project");',
            '  assert.equal(parsed.tracks.length, 1);',
            '});',
            '',
            'test("device validation rejects unsupported devices", () => {',
            '  const project = createProject({ name: "Test" });',
            '  const result = validateProjectForDevice(project, "unknown-device");',
            '',
            '  assert.equal(result.ok, false);',
            '  assert.equal(result.device, null);',
            '});',
            '',
            'test("KORG export plan maps tracks to slots", () => {',
            '  let project = createProject({',
            '    name: "Oriental Style",',
            '    tempo: 96,',
            '  });',
            '',
            '  project = addTrackToProject(project, {',
            '    id: "drums",',
            '    name: "Drums",',
            '    role: "drums",',
            '  });',
            '',
            '  project = addTrackToProject(project, {',
            '    id: "bass",',
            '    name: "Bass",',
            '    role: "bass",',
            '  });',
            '',
            '  const result = createDeviceExportPlan(project, "korg-pa5x");',
            '',
            '  assert.equal(result.ok, true);',
            '  assert.equal(result.plan.format, "KORG_STYLE");',
            '  assert.equal(result.plan.tracks[0].slot, 1);',
            '  assert.equal(result.plan.tracks[1].slot, 2);',
            '});'
        )

        Write-LinesNoBom -Path $TestPath -Lines $Lines
    }
}
else {
    Log "Phase 13 test already exists; preserved." "WARN"
}

# ======================================================
# INSTALL AND TEST
# ======================================================

if (-not $SkipInstall) {
    Step "Install frontend dependencies" {
        Set-Location $App

        if (Test-Path "package-lock.json") {
            npm ci --no-audit --no-fund

            if ($LASTEXITCODE -ne 0) {
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

Step "Run Phase 13 tests" {
    Set-Location $Root

    node --test "tests/phase13-project-export.test.mjs"

    if ($LASTEXITCODE -ne 0) {
        throw "Phase 13 tests failed."
    }
}

if (-not $SkipFullTests) {
    Step "Run full Node test suite" {
        Set-Location $Root

        node --test tests/*.test.mjs

        if ($LASTEXITCODE -ne 0) {
            throw "Some existing tests failed."
        }
    } -Optional
}

Step "Build frontend" {
    Set-Location $App

    npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed."
    }

    if (-not (Test-Path ".\dist\index.html")) {
        throw "dist/index.html was not generated."
    }
}

# ======================================================
# STAGE AND COMMIT
# ======================================================

Set-Location $Root

Step "Stage Phase 13 files" {
    Add-Existing "uaos-live-clean/src/daw/projectModel.js"
    Add-Existing "uaos-live-clean/src/arranger/deviceExportPlanner.js"
    Add-Existing "tests/phase13-project-export.test.mjs"
    Add-Existing "scripts/UAOS_PHASE13_PROJECT_EXPORT.ps1"
}

Step "Commit Phase 13" {
    $Staged = git diff --cached --name-only

    if (-not $Staged) {
        Log "Nothing new to commit." "WARN"
        return
    }

    $Staged |
        Set-Content `
            -LiteralPath (Join-Path $Reports "UAOS_PHASE13_STAGED_$Stamp.txt") `
            -Encoding utf8

    git commit -m "Add UAOS Phase 13 project model and device export planner"

    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed."
    }
}

# ======================================================
# SAFE REMOTE SYNC
# ======================================================

$StatusBeforeSync = git status --porcelain
$StashName = "UAOS-PHASE13-AUTO-STASH-$Stamp"
$UsedStash = $false

if ($StatusBeforeSync) {
    Step "Temporarily stash remaining local files" {
        git stash push --include-untracked -m $StashName

        if ($LASTEXITCODE -ne 0) {
            throw "Could not stash remaining local files."
        }

        $script:UsedStash = $true
    }
}

Step "Fetch remote branch" {
    git fetch origin --prune

    if ($LASTEXITCODE -ne 0) {
        throw "git fetch failed."
    }
}

git show-ref --verify --quiet "refs/remotes/origin/$Branch"
$RemoteExists = ($LASTEXITCODE -eq 0)

if ($RemoteExists) {
    Step "Rebase Phase 13 on remote branch" {
        git pull --rebase origin $Branch

        if ($LASTEXITCODE -ne 0) {
            git rebase --abort
            throw "Rebase failed and was aborted."
        }
    }
}

if (-not $SkipPush) {
    Step "Push current branch" {
        git push -u origin $Branch

        if ($LASTEXITCODE -ne 0) {
            throw "Push failed. No force push was used."
        }
    }
}

if ($UsedStash) {
    Step "Restore remaining local files" {
        $Match = git stash list |
            Select-String -SimpleMatch $StashName |
            Select-Object -First 1

        if ($Match) {
            git stash pop

            if ($LASTEXITCODE -ne 0) {
                Log "Commit was pushed, but stash restoration needs manual review." "WARN"
            }
        }
    } -Optional
}

# ======================================================

# ======================================================
# FINAL REPORT
# ======================================================

Step "Write Phase 13 report" {
    Set-Location $Root

    $CurrentCommit = git rev-parse --short HEAD
    $CurrentStatus = @(git status --short)
    $ReportPath = Join-Path $Reports "UAOS_PHASE13_STATUS.md"

    if ($CurrentStatus.Count -eq 0) {
        $StatusText = "Working tree clean."
    }
    else {
        $StatusText = $CurrentStatus -join [Environment]::NewLine
    }

    $ReportLines = @(
        "# UAOS Phase 13 Status",
        "",
        "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "",
        "## Branch",
        "",
        "- $Branch",
        "",
        "## Commit",
        "",
        "- $CurrentCommit",
        "",
        "## Completed",
        "",
        "- Added the UAOS DAW project model.",
        "- Added project serialization and parsing.",
        "- Added track management.",
        "- Added device export planning.",
        "- Added KORG PA3X and PA5X profiles.",
        "- Added Yamaha Genos profile.",
        "- Added Roland BK-9 profile.",
        "- Added Ketron SD9 profile.",
        "- Added export compatibility validation.",
        "- Added Phase 13 tests.",
        "- Ran the production build.",
        "- Saved work on the current development branch.",
        "",
        "## Limitation",
        "",
        "This phase creates export plans and validation.",
        "It does not generate proprietary keyboard style files yet.",
        "",
        "## Remaining Git status",
        "",
        "~~~text",
        $StatusText,
        "~~~"
    )

    $ReportLines |
        Set-Content `
            -LiteralPath $ReportPath `
            -Encoding utf8

    Log "Report: $ReportPath" "PASS"
}

Log "======================================================"
Log "UAOS PHASE 13 COMPLETED" "PASS"
Log "Branch: $Branch" "PASS"
Log "Log: $Log" "PASS"
Log "======================================================"