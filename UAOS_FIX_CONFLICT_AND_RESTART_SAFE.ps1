$ErrorActionPreference = "Stop"

try {
    $Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
    $App  = Join-Path $Root "uaos-live-clean"
    $Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Backup = Join-Path $Root "reports\SAFE_CONFLICT_BACKUP_$Stamp"

    Set-Location $Root
    New-Item -ItemType Directory -Force $Backup | Out-Null

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " UAOS SAFE CONFLICT FIX + DEV RESTART" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $Branch = (git branch --show-current).Trim()

    Write-Host "Branch: $Branch" -ForegroundColor Yellow
    Write-Host "Backup: $Backup" -ForegroundColor Yellow

    git status | Set-Content "$Backup\git-status-before.txt" -Encoding UTF8
    git diff | Set-Content "$Backup\working-tree-before.diff" -Encoding UTF8
    git diff --cached | Set-Content "$Backup\staged-before.diff" -Encoding UTF8

    # حفظ الملفات المتعارضة قبل أي إصلاح
    $ConflictedFiles = @(git diff --name-only --diff-filter=U)

    foreach ($File in $ConflictedFiles) {
        $Source = Join-Path $Root $File

        if (Test-Path -LiteralPath $Source) {
            $Destination = Join-Path $Backup $File
            $Folder = Split-Path $Destination -Parent

            New-Item -ItemType Directory -Force $Folder | Out-Null
            Copy-Item -LiteralPath $Source -Destination $Destination -Force
        }
    }

    # إلغاء العملية العالقة فقط، بدون reset أو pull
    if (Test-Path ".git\MERGE_HEAD") {
        Write-Host "Aborting unfinished merge..." -ForegroundColor Yellow
        git merge --abort

        if ($LASTEXITCODE -ne 0) {
            throw "git merge --abort failed"
        }
    }

    if (
        (Test-Path ".git\rebase-merge") -or
        (Test-Path ".git\rebase-apply")
    ) {
        Write-Host "Aborting unfinished rebase..." -ForegroundColor Yellow
        git rebase --abort

        if ($LASTEXITCODE -ne 0) {
            throw "git rebase --abort failed"
        }
    }

    if (Test-Path ".git\CHERRY_PICK_HEAD") {
        Write-Host "Aborting unfinished cherry-pick..." -ForegroundColor Yellow
        git cherry-pick --abort

        if ($LASTEXITCODE -ne 0) {
            throw "git cherry-pick --abort failed"
        }
    }

    # البحث عن علامات التعارض داخل ملفات التطبيق
    $MarkerResults = @(
        Get-ChildItem `
            -Path "$App\src" `
            -Recurse `
            -File `
            -Include *.js,*.jsx,*.mjs,*.cjs,*.ts,*.tsx,*.json,*.css `
            -ErrorAction SilentlyContinue |
        Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)'
    )

    if ($MarkerResults.Count -gt 0) {
        Write-Host "Conflict markers remain. Restoring only affected files from current HEAD..." -ForegroundColor Yellow

        $MarkerFiles = @(
            $MarkerResults |
            ForEach-Object {
                $_.Path.Substring($Root.Length + 1)
            } |
            Sort-Object -Unique
        )

        $MarkerFiles | Set-Content "$Backup\restored-conflict-files.txt" -Encoding UTF8

        foreach ($File in $MarkerFiles) {
            $Source = Join-Path $Root $File

            if (Test-Path -LiteralPath $Source) {
                $Destination = Join-Path $Backup ("markers-" + ($File -replace '[\\/:*?"<>|]', "_"))
                Copy-Item -LiteralPath $Source -Destination $Destination -Force
            }

            git restore --source=HEAD --staged --worktree -- "$File"

            if ($LASTEXITCODE -ne 0) {
                throw "Could not restore conflict file: $File"
            }
        }
    }

    # تأكيد عدم بقاء العلامات
    $RemainingMarkers = @(
        Get-ChildItem `
            -Path "$App\src" `
            -Recurse `
            -File `
            -Include *.js,*.jsx,*.mjs,*.cjs,*.ts,*.tsx,*.json,*.css `
            -ErrorAction SilentlyContinue |
        Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)'
    )

    if ($RemainingMarkers.Count -gt 0) {
        Write-Host ""
        Write-Host "Conflict markers still exist:" -ForegroundColor Red

        $RemainingMarkers |
            Select-Object Path, LineNumber, Line |
            Format-Table -AutoSize

        throw "Conflict markers remain"
    }

    Write-Host ""
    Write-Host "Running frontend build..." -ForegroundColor Cyan

    npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }

    Write-Host "BUILD PASS" -ForegroundColor Green

    Write-Host ""
    Write-Host "Running desktop smoke..." -ForegroundColor Cyan

    npm run desktop:smoke

    if ($LASTEXITCODE -ne 0) {
        throw "Desktop smoke failed"
    }

    Write-Host "DESKTOP SMOKE PASS" -ForegroundColor Green

    # عدم قتل أي Vite موجود
    $ViteRunning = Get-NetTCPConnection `
        -LocalPort 5173 `
        -State Listen `
        -ErrorAction SilentlyContinue

    if (-not $ViteRunning) {
        Write-Host ""
        Write-Host "Starting UAOS Vite server in a separate PowerShell window..." -ForegroundColor Cyan

        $DevCommand = "Set-Location -LiteralPath '$App'; npm run dev"

        Start-Process powershell.exe -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            $DevCommand
        )

        Start-Sleep -Seconds 5
    }
    else {
        Write-Host "Vite is already running on port 5173." -ForegroundColor Green
    }

    Start-Process "http://127.0.0.1:5173"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " FIX COMPLETE - BROWSER RECONNECTED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "No deploy executed." -ForegroundColor Green
    Write-Host "No pull, stash, reset, or process kill executed." -ForegroundColor Green
    Write-Host "Backup: $Backup" -ForegroundColor Yellow

    git status --short
}
catch {
    Write-Host ""
    Write-Host "SAFE FIX STOPPED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "PowerShell will remain open." -ForegroundColor Yellow
    Write-Host "No deploy was executed." -ForegroundColor Yellow
}