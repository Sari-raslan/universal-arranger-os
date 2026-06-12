$ErrorActionPreference = "Stop"

$OriginalRoot = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$CleanRoot = "$HOME\Desktop\UAOS_AUTO_FIXED_$Stamp"
$ReportRoot = Join-Path $OriginalRoot "reports"
$Log = Join-Path $ReportRoot "UAOS_AUTO_FIX_$Stamp.txt"

New-Item -ItemType Directory -Force $ReportRoot | Out-Null

function L($Message) {
    $Line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Write-Host $Line
    $Line | Out-File -FilePath $Log -Append -Encoding UTF8
}

function Run-Step {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [bool]$Required = $true
    )

    L "START: $Name"

    & $Command
    $Code = $LASTEXITCODE

    if ($Code -eq 0) {
        L "PASS: $Name"
        return $true
    }

    if ($Required) {
        throw "$Name failed with exit code $Code"
    }

    L "SKIP/WARNING: $Name failed with exit code $Code"
    return $false
}

try {
    Set-Location $OriginalRoot

    L "UAOS AUTOMATIC FIX START"
    L "Original project: $OriginalRoot"
    L "Clean recovery: $CleanRoot"
    L "NO DEPLOY MODE"

    $CurrentBranch = (git branch --show-current).Trim()

    if ([string]::IsNullOrWhiteSpace($CurrentBranch)) {
        $CurrentBranch = "master"
    }

    L "Current branch: $CurrentBranch"

    git status | Out-File "$ReportRoot\git-status-before-$Stamp.txt" -Encoding UTF8
    git diff | Out-File "$ReportRoot\git-diff-before-$Stamp.patch" -Encoding UTF8
    git diff --cached | Out-File "$ReportRoot\git-diff-staged-$Stamp.patch" -Encoding UTF8

    if (Test-Path ".git\MERGE_HEAD") {
        L "Unfinished merge detected. Aborting merge."
        git merge --abort

        if ($LASTEXITCODE -ne 0) {
            throw "Could not abort unfinished merge"
        }
    }

    if (
        (Test-Path ".git\rebase-merge") -or
        (Test-Path ".git\rebase-apply")
    ) {
        L "Unfinished rebase detected. Aborting rebase."
        git rebase --abort

        if ($LASTEXITCODE -ne 0) {
            throw "Could not abort unfinished rebase"
        }
    }

    if (Test-Path ".git\CHERRY_PICK_HEAD") {
        L "Unfinished cherry-pick detected. Aborting cherry-pick."
        git cherry-pick --abort

        if ($LASTEXITCODE -ne 0) {
            throw "Could not abort unfinished cherry-pick"
        }
    }

    L "Fetching remote branches"
    git fetch origin --prune

    if ($LASTEXITCODE -ne 0) {
        throw "git fetch failed"
    }

    $PreferredBranches = @(
        "codex/uaos-v1-production",
        "codex/uaos-v2-pro-arranger",
        "codex/uaos-v3-ai-labs",
        $CurrentBranch,
        "master"
    )

    $TargetBranch = $null

    foreach ($Candidate in $PreferredBranches) {
        git rev-parse --verify "origin/$Candidate" *> $null

        if ($LASTEXITCODE -eq 0) {
            $TargetBranch = $Candidate
            break
        }
    }

    if ([string]::IsNullOrWhiteSpace($TargetBranch)) {
        throw "No usable remote branch found"
    }

    L "Selected recovery branch: origin/$TargetBranch"

    if (Test-Path $CleanRoot) {
        Remove-Item $CleanRoot -Recurse -Force
    }

    L "Creating clean Git worktree"

    git worktree add --detach $CleanRoot "origin/$TargetBranch"

    if ($LASTEXITCODE -ne 0) {
        throw "Could not create clean worktree"
    }

    Set-Location $CleanRoot

    $ConflictMarkers = @(
        Get-ChildItem `
            -Path $CleanRoot `
            -Recurse `
            -File `
            -Include *.js,*.jsx,*.mjs,*.cjs,*.ts,*.tsx,*.json,*.css `
            -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "\\node_modules\\" -and
            $_.FullName -notmatch "\\dist\\"
        } |
        Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)'
    )

    if ($ConflictMarkers.Count -gt 0) {
        $ConflictMarkers |
            ForEach-Object {
                "$($_.Path):$($_.LineNumber): $($_.Line)"
            } |
            Set-Content "$ReportRoot\conflict-markers-$Stamp.txt" -Encoding UTF8

        throw "Conflict markers exist in the selected remote branch"
    }

    if (Test-Path ".\backend\package.json") {
        if (!(Test-Path ".\backend\node_modules")) {
            Run-Step "Backend install" {
                npm install --prefix backend
            }
        }
        else {
            L "Backend node_modules already exists"
        }
    }

    if (Test-Path ".\uaos-live-clean\package.json") {
        if (!(Test-Path ".\uaos-live-clean\node_modules")) {
            Run-Step "Frontend install" {
                npm install --prefix uaos-live-clean
            }
        }
        else {
            L "Frontend node_modules already exists"
        }
    }
    else {
        throw "uaos-live-clean package.json missing"
    }

    $Package = Get-Content ".\package.json" -Raw | ConvertFrom-Json
    $ScriptNames = @($Package.scripts.PSObject.Properties.Name)

    if ($ScriptNames -contains "check") {
        Run-Step "CHECK" {
            npm run check
        }
    }
    else {
        L "CHECK skipped: script not available"
    }

    if ($ScriptNames -contains "test") {
        Run-Step "TEST" {
            npm test
        }
    }
    else {
        L "TEST skipped: script not available"
    }

    Run-Step "BUILD" {
        npm run build
    }

    if ($ScriptNames -contains "desktop:smoke") {
        Run-Step "DESKTOP SMOKE" {
            npm run desktop:smoke
        } $false
    }
    elseif (Test-Path ".\scripts\uaos-desktop-smoke.mjs") {
        Run-Step "DESKTOP SMOKE DIRECT" {
            node ".\scripts\uaos-desktop-smoke.mjs"
        } $false
    }
    else {
        L "DESKTOP SMOKE skipped: not available on this branch"
    }

    $Port = 5173

    $ExistingServer = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($ExistingServer) {
        $Port = 5174
    }

    $AppPath = Join-Path $CleanRoot "uaos-live-clean"

    L "Starting clean UAOS on port $Port"

    $DevCommand = @"
Set-Location -LiteralPath '$AppPath'
npm run dev -- --port $Port
"@

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $DevCommand
    )

    Start-Sleep -Seconds 6

    $Url = "http://127.0.0.1:$Port"

    try {
        $Response = Invoke-WebRequest `
            -Uri $Url `
            -UseBasicParsing `
            -TimeoutSec 15

        if ($Response.StatusCode -eq 200) {
            L "LOCAL SERVER PASS: $Url => 200"
        }
        else {
            L "LOCAL SERVER WARNING: $Url => $($Response.StatusCode)"
        }
    }
    catch {
        L "LOCAL SERVER WARNING: $($_.Exception.Message)"
    }

    Start-Process $Url

    $FinalReport = @(
        "UAOS AUTOMATIC RECOVERY COMPLETE"
        ""
        "Original project:"
        $OriginalRoot
        ""
        "Clean fixed project:"
        $CleanRoot
        ""
        "Selected branch:"
        "origin/$TargetBranch"
        ""
        "Local URL:"
        $Url
        ""
        "No deploy executed."
        "No production alias changed."
        "Original folder was not reset."
    )

    $FinalReport |
        Set-Content "$ReportRoot\UAOS_AUTO_FIX_COMPLETE_$Stamp.txt" -Encoding UTF8

    L "UAOS AUTOMATIC FIX COMPLETE"
    L "Clean project: $CleanRoot"
    L "Local URL: $Url"
    L "Original project preserved"
    L "NO DEPLOY"

    Set-Location $OriginalRoot
}
catch {
    L "AUTO FIX FAILED"
    L $_.Exception.Message
    L "Original project was preserved"
    L "No deploy executed"

    Set-Location $OriginalRoot
}

Write-Host ""
Write-Host "PowerShell will remain open." -ForegroundColor Yellow
Write-Host "Log: $Log" -ForegroundColor Yellow