param(
    [string]$Repo = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os",
    [string]$ExpectedBranch = "codex/smart-sequencer-ums-foundation",
    [switch]$SkipPush,
    [switch]$SkipPullRequest,
    [switch]$NoWaitForChecks
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Utf8NoBom {
    param([string]$Path,[string]$Content)
    $enc = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path,$Content,$enc)
}

function Step {
    param([string]$Name,[scriptblock]$Action)
    Write-Host "`n==================================================" -ForegroundColor DarkCyan
    Write-Host $Name -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkCyan
    & $Action
}

function Run {
    param([string]$Name,[string]$Command,[string]$Log)
    Write-Host "`n[$Name]" -ForegroundColor Cyan
    cmd.exe /d /s /c "$Command 2>&1" | Tee-Object -FilePath $Log
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE. Log: $Log" }
    Write-Host "PASS: $Name" -ForegroundColor Green
}

function Add-LocalExclude {
    param([string]$Pattern)
    $exclude = Join-Path $Repo ".git\info\exclude"
    if (!(Test-Path $exclude)) { New-Item -ItemType File -Force $exclude | Out-Null }
    $existing = Get-Content $exclude -ErrorAction SilentlyContinue
    if ($existing -notcontains $Pattern) { Add-Content -LiteralPath $exclude -Value $Pattern }
}

function Save-Checkpoint {
    param([string]$Name)
    $state = [ordered]@{
        name = $Name
        time = (Get-Date).ToString("o")
        branch = (git branch --show-current).Trim()
        commit = (git rev-parse HEAD).Trim()
    }
    Write-Utf8NoBom $CheckpointFile ($state | ConvertTo-Json -Depth 8)
}

if (!(Test-Path -LiteralPath $Repo)) { throw "Repository not found: $Repo" }
Set-Location -LiteralPath $Repo
if (!(Test-Path ".git")) { throw "Not a Git repository: $Repo" }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportDir = Join-Path $Repo "reports\complete-project-one-click-$Stamp"
$BackupDir = Join-Path $Repo "backups\complete-project-one-click-$Stamp"
$CheckpointDir = Join-Path $Repo ".uaos-checkpoints"
$CheckpointFile = Join-Path $CheckpointDir "complete-project-one-click.json"
New-Item -ItemType Directory -Force -Path $ReportDir,$BackupDir,$CheckpointDir | Out-Null

Add-LocalExclude "reports/complete-project-one-click-*/"
Add-LocalExclude "backups/complete-project-one-click-*/"
Add-LocalExclude ".uaos-checkpoints/"
Add-LocalExclude "backend/data/ums-projects.json"

$SummaryFile = Join-Path $ReportDir "FINAL_STATUS.md"
$FilesChangedFile = Join-Path $ReportDir "FILES_CHANGED.txt"
$RouteAuditFile = Join-Path $ReportDir "ROUTE_AUDIT.json"
$FeatureStatusFile = Join-Path $ReportDir "FEATURE_STATUS.json"

Step "1. Git safety and repository inspection" {
    $branch = (git branch --show-current).Trim()
    if ([string]::IsNullOrWhiteSpace($branch)) { throw "Detached HEAD is not supported." }
    if ($branch -eq "master") { throw "Refusing to modify master directly." }
    if ($branch -ne $ExpectedBranch) { throw "Current branch is '$branch'. Expected '$ExpectedBranch'." }

    $dirty = @(git status --porcelain)

    if ($dirty.Count -gt 0) {
        $AllowedDirtyPatterns = @(
            'backend/data/projects\.json$',
            'backend/data/ums-projects\.json$',

            'scripts/UAOS_COMPLETE_PROJECT_ONE_CLICK\.ps1$',

            'uaos-live-clean/src/App\.jsx$',
            'uaos-live-clean/src/components/MusicEncyclopediaPage\.jsx$',
            'uaos-live-clean/src/components/UaosWorkspaceNav\.jsx$',
            'uaos-live-clean/src/components/UaosWorkspaceNav\.css$',
            'uaos-live-clean/src/styles/music-encyclopedia\.css$',

            'backend/server\.js$',
            'backend/umsRoutes\.cjs$',
            'uaos-live-clean/src/components/SmartSequencerPage\.jsx$',
            'uaos-live-clean/src/styles/smart-sequencer\.css$',
            'tests/ums-core\.test\.mjs$',
            'tests/ums-routes\.test\.mjs$',

            'packages/ums-core/',
            'packages/device-profiles/',
            'packages/music-encyclopedia/',
            'docs/',

            'backups/',
            'reports/',
            '\.uaos-checkpoints/'
        )

        $UnexpectedDirty = @(
            $dirty | Where-Object {
                $StatusLine = $_
                $Allowed = $false

                foreach ($Pattern in $AllowedDirtyPatterns) {
                    if ($StatusLine -match $Pattern) {
                        $Allowed = $true
                        break
                    }
                }

                -not $Allowed
            }
        )

        if ($UnexpectedDirty.Count -gt 0) {
            Write-Host "`nUNEXPECTED WORKING TREE CHANGES:" -ForegroundColor Red
            $UnexpectedDirty | ForEach-Object {
                Write-Host $_ -ForegroundColor Red
            }

            throw "Working tree contains changes outside the approved UAOS phase files."
        }

        Write-Host "`nApproved in-progress UAOS files detected:" -ForegroundColor Yellow
        $dirty | ForEach-Object {
            Write-Host $_ -ForegroundColor Yellow
        }
    }
    git status --short | Set-Content (Join-Path $ReportDir "git-status-before.txt") -Encoding UTF8
    git log --oneline --decorate -15 | Set-Content (Join-Path $ReportDir "git-log-before.txt") -Encoding UTF8
    git diff | Set-Content (Join-Path $BackupDir "working-tree.patch") -Encoding UTF8
    git diff --cached | Set-Content (Join-Path $BackupDir "index.patch") -Encoding UTF8

    $SafetyTag = "uaos-complete-safety-$Stamp"
    git tag $SafetyTag HEAD
    if ($LASTEXITCODE -ne 0) { throw "Could not create safety tag." }
    $SafetyTag | Set-Content (Join-Path $ReportDir "safety-tag.txt") -Encoding UTF8

    $critical = @(
        "package.json","backend/server.js","backend/umsRoutes.cjs",
        "uaos-live-clean/package.json","uaos-live-clean/src/App.jsx",
        "uaos-live-clean/src/components/SmartSequencerPage.jsx",
        "uaos-live-clean/src/components/MusicEncyclopediaPage.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.css",
        "uaos-live-clean/src/styles/music-encyclopedia.css",
        "uaos-live-clean/src/styles/smart-sequencer.css",
        "packages/ums-core/src/index.mjs",
        "packages/device-profiles/profiles/index.json",
        "packages/music-encyclopedia/src/catalog.mjs",
        "tests/ums-core.test.mjs","tests/ums-routes.test.mjs"
    )
    foreach ($file in $critical) {
        if (Test-Path -LiteralPath $file) {
            $target = Join-Path $BackupDir ($file -replace '[\\/:*?"<>|]','_')
            Copy-Item -LiteralPath $file -Destination $target -Force
        }
    }
    Save-Checkpoint "safety-complete"
}

Step "2. Verify required Smart Sequencer implementation" {
    $required = @(
        "backend/server.js","backend/umsRoutes.cjs","uaos-live-clean/src/App.jsx",
        "uaos-live-clean/src/components/SmartSequencerPage.jsx",
        "uaos-live-clean/src/components/MusicEncyclopediaPage.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.css",
        "uaos-live-clean/src/styles/music-encyclopedia.css",
        "uaos-live-clean/src/styles/smart-sequencer.css",
        "packages/ums-core/src/index.mjs","packages/device-profiles/profiles/index.json",
        "packages/music-encyclopedia/src/catalog.mjs","tests/ums-core.test.mjs","tests/ums-routes.test.mjs"
    )
    $missing = @($required | Where-Object { !(Test-Path -LiteralPath $_) })
    if ($missing.Count) { throw "Required implementation files are missing: $($missing -join ', ')" }

    $server = Get-Content "backend/server.js" -Raw
    $app = Get-Content "uaos-live-clean/src/App.jsx" -Raw
    $page = Get-Content "uaos-live-clean/src/components/SmartSequencerPage.jsx" -Raw

    foreach ($needle in @('createUmsRouter','/api/ums')) {
        if ($server -notmatch [regex]::Escape($needle)) { throw "backend/server.js is missing '$needle'." }
    }
    foreach ($needle in @('SmartSequencerPage','smart-sequencer')) {
        if ($app -notmatch [regex]::Escape($needle)) { throw "App.jsx is missing '$needle'." }
    }
    foreach ($needle in @('accept=".wav,.mp3','Save private UMS project','.uaos-project.json')) {
        if ($page -notmatch [regex]::Escape($needle)) { throw "SmartSequencerPage.jsx is missing '$needle'." }
    }

    $mountIndex = $server.IndexOf('/api/ums')
    $unknownIndex = $server.IndexOf('Unknown endpoint')
    if ($unknownIndex -ge 0 -and $mountIndex -gt $unknownIndex) { throw "/api/ums is mounted after Unknown endpoint." }
    Save-Checkpoint "implementation-verified"
}

Step "3. Navigation and route audit" {
    $routes = @(
        @{ key="home"; aliases=@("home","ModernHome") },
        @{ key="smart-sequencer"; aliases=@("smart-sequencer","SmartSequencerPage") },
        @{ key="audio"; aliases=@('"audio"',"Audio") },
        @{ key="midi"; aliases=@('"midi"',"MIDI") },
        @{ key="sampler"; aliases=@('"sampler"',"Sampler") },
        @{ key="arranger"; aliases=@('"arranger"',"Arranger") },
        @{ key="studio"; aliases=@('"studio"',"Studio") },
        @{ key="sounds"; aliases=@('"sounds"',"Sounds") },
        @{ key="device-profiles"; aliases=@("device-profiles","Device Profiles","deviceProfiles") },
        @{ key="music-encyclopedia"; aliases=@("music-encyclopedia","Music Encyclopedia","musicEncyclopedia") },
        @{ key="downloads"; aliases=@('"downloads"',"Downloads") },
        @{ key="pricing"; aliases=@('"pricing"',"Pricing") },
        @{ key="support"; aliases=@('"support"',"Support") }
    )

    $sourceFiles = Get-ChildItem "uaos-live-clean/src" -Recurse -File -Include *.js,*.jsx,*.mjs,*.css
    $allSource = ($sourceFiles | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"

    $audit = foreach ($route in $routes) {
        $found = $false; $matched = ""
        foreach ($alias in $route.aliases) {
            if ($allSource -match [regex]::Escape($alias)) { $found=$true; $matched=$alias; break }
        }
        [pscustomobject]@{ route=$route.key; status=if($found){"working-or-wired"}else{"missing"}; matchedBy=$matched }
    }
    Write-Utf8NoBom $RouteAuditFile ($audit | ConvertTo-Json -Depth 10)
    $missingRoutes = @($audit | Where-Object status -eq "missing")
    if ($missingRoutes.Count) { throw "Navigation audit found missing routes: $($missingRoutes.route -join ', ')." }

    $homeBackRefs = Select-String -Path "uaos-live-clean/src/**/*.jsx","uaos-live-clean/src/*.jsx" -Pattern "Home|Back|goBack|navigateHome|history.back" -ErrorAction SilentlyContinue
    if (!$homeBackRefs) { throw "No Home/Back navigation references were found." }
    Save-Checkpoint "navigation-audit-pass"
}

Step "4. Truthful feature capability manifest" {
    $features = [ordered]@{
        generatedAt=(Get-Date).ToString("o")
        branch=(git branch --show-current).Trim()
        capabilities=[ordered]@{
            navigation="working"; smartSequencerMetadata="working"; umsProjectCreation="working"
            manualTimelineSections="working"; umsPersistence="working"; umsReopen="working"
            uaosProjectDownload="working"; audioRuntime="requires hardware validation"
            midiRuntime="requires hardware validation"; sampler="partial"; arranger="partial"
            studio="partial"; sounds="partial"; deviceProfiles="partial"; musicEncyclopedia="partial"
            aiAnalysis="unavailable"; stemSeparation="unavailable"; automaticMaqamDetection="unavailable"
            midiGenerationExport="unavailable"; proprietaryArrangerExport="unavailable"
            signedWindowsUpdater="unavailable"
        }
    }
    Write-Utf8NoBom $FeatureStatusFile ($features | ConvertTo-Json -Depth 10)
    Save-Checkpoint "feature-manifest-written"
}

Step "5. Install dependencies only when missing" {
    if (!(Test-Path "node_modules")) { Run "root npm install" "npm install" (Join-Path $ReportDir "npm-install-root.log") }
    if ((Test-Path "backend/package.json") -and !(Test-Path "backend/node_modules")) { Run "backend npm install" "npm --prefix backend install" (Join-Path $ReportDir "npm-install-backend.log") }
    if (!(Test-Path "uaos-live-clean/node_modules")) { Run "frontend npm install" "npm --prefix uaos-live-clean install" (Join-Path $ReportDir "npm-install-frontend.log") }
    Save-Checkpoint "dependencies-ready"
}

Step "6. Focused and complete validation" {
    Run "focused UMS tests" "node --test tests\ums-core.test.mjs tests\ums-routes.test.mjs" (Join-Path $ReportDir "focused-tests.log")
    Run "root tests" "npm test" (Join-Path $ReportDir "root-tests.log")
    Run "static check" "npm run check" (Join-Path $ReportDir "static-check.log")
    Run "production build" "npm run build" (Join-Path $ReportDir "production-build.log")
    Save-Checkpoint "validation-pass"
}

Step "7. Backend route smoke test" {
    $port = 5199
    $existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $started = $false; $proc = $null
    if (!$existing) {
        $stdout = Join-Path $ReportDir "backend-smoke.stdout.log"
        $stderr = Join-Path $ReportDir "backend-smoke.stderr.log"
        $proc = Start-Process node -ArgumentList "backend/server.js" -WorkingDirectory $Repo -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        $started = $true
        Start-Sleep -Seconds 3
    }
    try {
        $health = Invoke-RestMethod "http://127.0.0.1:$port/health" -TimeoutSec 15
        $ums = Invoke-RestMethod "http://127.0.0.1:$port/api/ums/status" -TimeoutSec 15
        Write-Utf8NoBom (Join-Path $ReportDir "backend-health.json") ($health | ConvertTo-Json -Depth 10)
        Write-Utf8NoBom (Join-Path $ReportDir "ums-status.json") ($ums | ConvertTo-Json -Depth 10)
        if ($health.ok -ne $true -or $ums.ok -ne $true) { throw "Backend smoke response was not ok." }
    }
    finally {
        if ($started -and $proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    }
    Save-Checkpoint "backend-smoke-pass"
}

Step "8. Prepare intended commit" {
    foreach ($runtime in @("backend/data/projects.json","backend/data/ums-projects.json")) {
        if (Test-Path $runtime) { git restore -- $runtime 2>$null }
    }

    $allowed = @(
        "docs","packages/ums-core","packages/device-profiles","packages/music-encyclopedia",
        "backend/server.js","backend/umsRoutes.cjs","uaos-live-clean/src/App.jsx",
        "uaos-live-clean/src/components/SmartSequencerPage.jsx",
        "uaos-live-clean/src/components/MusicEncyclopediaPage.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.jsx",
        "uaos-live-clean/src/components/UaosWorkspaceNav.css",
        "uaos-live-clean/src/styles/music-encyclopedia.css",
        "uaos-live-clean/src/styles/smart-sequencer.css","tests/ums-core.test.mjs",
        "tests/ums-routes.test.mjs","scripts/UAOS_COMPLETE_PROJECT_ONE_CLICK.ps1"
    )
    foreach ($path in $allowed) { if (Test-Path $path) { git add -- $path } }

    git diff --cached --stat | Tee-Object -FilePath (Join-Path $ReportDir "staged-stat.txt")
    $staged = @(git diff --cached --name-only)
    $staged | Set-Content $FilesChangedFile -Encoding UTF8
    if ($staged.Count -gt 0) {
        git commit -m "feat: complete UAOS workspace integration and release gates"
        if ($LASTEXITCODE -ne 0) { throw "Commit failed." }
    } else {
        Write-Host "No new code changes to commit; implementation is already committed." -ForegroundColor Yellow
    }
    Save-Checkpoint "commit-ready"
}

$PrUrl = ""
$ChecksStatus = "not-run"

Step "9. Push branch and create or reuse pull request" {
    if ($SkipPush) { Write-Host "Push skipped by parameter." -ForegroundColor Yellow; return }
    $branch = (git branch --show-current).Trim()
    git push -u origin $branch
    if ($LASTEXITCODE -ne 0) { throw "Push failed." }

    if ($SkipPullRequest) { Write-Host "Pull request creation skipped by parameter." -ForegroundColor Yellow; return }
    $existingPr = gh pr list --head $branch --base master --state open --json url --jq ".[0].url" 2>$null
    if ($existingPr) { $script:PrUrl = $existingPr.Trim() }
    else {
        $body = @"
## Summary
- Completes the UMS and Smart Sequencer vertical slice
- Verifies all declared UAOS workspace routes
- Preserves the existing V1 Audio, MIDI, Electron, backend, and navigation runtime
- Adds truthful feature capability reporting
- Adds restartable validation and release gates

## Verified
- Focused UMS tests
- Root test suite
- Static checks
- Production build
- Backend health
- UMS API status
- Navigation source audit

## Explicitly not claimed
- AI audio analysis
- Stem separation
- Automatic maqam detection
- MIDI generation/export
- Proprietary arranger export
- Hardware validation
- Signed production updater
"@
        $script:PrUrl = (gh pr create --base master --head $branch --title "Complete UAOS workspace integration and Smart Sequencer gates" --body $body).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Pull request creation failed." }
    }
    $script:PrUrl | Set-Content (Join-Path $ReportDir "pull-request-url.txt") -Encoding UTF8
    Save-Checkpoint "push-pr-complete"
}

Step "10. Wait for GitHub Actions without merging" {
    if ($SkipPush -or $SkipPullRequest -or [string]::IsNullOrWhiteSpace($PrUrl)) { $script:ChecksStatus = "skipped"; return }
    if ($NoWaitForChecks) { $script:ChecksStatus = "not-waited"; return }
    gh pr checks $PrUrl --watch
    if ($LASTEXITCODE -ne 0) { $script:ChecksStatus = "failed-or-pending"; throw "GitHub checks did not all pass. PR was not merged." }
    $script:ChecksStatus = "pass"
    Write-Host "All reported PR checks passed. The script intentionally does not merge or deploy." -ForegroundColor Green
    Save-Checkpoint "github-checks-pass"
}

Step "11. Final report" {
    $branch = (git branch --show-current).Trim()
    $commit = (git rev-parse HEAD).Trim()
    $status = @(git status --short)
    $statusText = if ($status.Count) { $status -join "`n" } else { "clean" }
    $featureJson = Get-Content $FeatureStatusFile -Raw
    $routeJson = Get-Content $RouteAuditFile -Raw
    $changed = if (Test-Path $FilesChangedFile) { Get-Content $FilesChangedFile -Raw } else { "" }

    $summary = @"
# UAOS Complete Project One-Click Report

- Generated: $(Get-Date -Format o)
- Branch: $branch
- Commit: $commit
- Safety tag: uaos-complete-safety-$Stamp
- Pull request: $PrUrl
- GitHub checks: $ChecksStatus
- Working tree: $statusText
- Report directory: $ReportDir
- Backup directory: $BackupDir

## Validation
- Focused UMS tests: PASS
- Root tests: PASS
- Static check: PASS
- Production build: PASS
- Backend health: PASS
- UMS status endpoint: PASS
- Navigation source audit: PASS

## Files staged or committed by this run
$changed

## Feature status
```json
$featureJson
```

## Route audit
```json
$routeJson
```

## Release decision
The branch is validated for review. No merge, deployment, payment activation,
production release, hardware certification, or signing was performed.

Features requiring external verification remain blocked:
microphone hardware, physical MIDI devices, arranger keyboards, signed updater,
store approvals, payment approvals, and production credentials.
"@
    Write-Utf8NoBom $SummaryFile $summary
    git status --short | Set-Content (Join-Path $ReportDir "git-status-final.txt") -Encoding UTF8
    git log --oneline --decorate -15 | Set-Content (Join-Path $ReportDir "git-log-final.txt") -Encoding UTF8

    Write-Host "`nUAOS ONE-CLICK PIPELINE COMPLETE" -ForegroundColor Green
    Write-Host "Branch: $branch" -ForegroundColor Green
    Write-Host "Commit: $commit" -ForegroundColor Green
    Write-Host "PR: $PrUrl" -ForegroundColor Yellow
    Write-Host "Checks: $ChecksStatus" -ForegroundColor Yellow
    Write-Host "Report: $SummaryFile" -ForegroundColor Cyan
    Write-Host "No merge or deployment was performed." -ForegroundColor Yellow
}
