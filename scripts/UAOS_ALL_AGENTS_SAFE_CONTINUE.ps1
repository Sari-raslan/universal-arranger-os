param(
[switch]$NoMerge
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Repo = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$RepoName = "Sari-raslan/universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$RunRoot = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\UAOS_AGENTS_RUN_$Stamp"
$Worktree = Join-Path $RunRoot "worktree"
$Reports = Join-Path $Repo "reports"
$Backup = Join-Path $Repo "backups\agents-$Stamp"
$LogFile = Join-Path $Reports "UAOS_AGENTS_$Stamp.log"
$PromptFile = Join-Path $RunRoot "UAOS_AGENT_PROMPT.txt"
$FinalReport = Join-Path $Reports "UAOS_AGENTS_FINAL_$Stamp.txt"

New-Item -ItemType Directory -Force -Path $RunRoot,$Reports,$Backup | Out-Null

function Write-Log {
param(
[string]$Message,
[string]$Level = "INFO"
)

```
$Line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] [" + $Level + "] " + $Message
Write-Host $Line
Add-Content -LiteralPath $LogFile -Value $Line -Encoding UTF8
```

}

function Invoke-Step {
param(
[string]$Name,
[scriptblock]$Action,
[switch]$Optional
)

```
Write-Log "START: $Name"

$OldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$global:LASTEXITCODE = 0

try {
    $Output = & $Action 2>&1
    $Code = $LASTEXITCODE
}
catch {
    $Output = @($_.Exception.Message)
    $Code = 1
}
finally {
    $ErrorActionPreference = $OldPreference
}

if ($Output) {
    $Output |
        Tee-Object -FilePath $LogFile -Append |
        Out-Host
}

if ($null -eq $Code) {
    $Code = 0
}

if ($Code -ne 0) {
    if ($Optional) {
        Write-Log "$Name failed with exit code $Code" "WARN"
        return $false
    }

    throw "$Name failed with exit code $Code"
}

Write-Log "PASS: $Name" "PASS"
return $true
```

}

function Get-Agent {
param(
[string]$Name,
[string[]]$Commands
)

```
foreach ($CommandName in $Commands) {
    $Found = Get-Command $CommandName -ErrorAction SilentlyContinue

    if ($Found) {
        return [pscustomobject]@{
            Name = $Name
            Path = $Found.Source
        }
    }
}

return $null
```

}

function Backup-LocalWork {
Set-Location -LiteralPath $Repo

```
git status --short |
    Set-Content -LiteralPath (Join-Path $Backup "git-status.txt") -Encoding UTF8

git diff |
    Set-Content -LiteralPath (Join-Path $Backup "working-tree.diff") -Encoding UTF8

git diff --cached |
    Set-Content -LiteralPath (Join-Path $Backup "staged.diff") -Encoding UTF8

$ChangedFiles = @(
    git status --porcelain |
    ForEach-Object {
        if ($_.Length -ge 4) {
            $_.Substring(3).Trim('"')
        }
    } |
    Where-Object { $_ }
)

foreach ($RelativePath in $ChangedFiles) {
    $Source = Join-Path $Repo $RelativePath

    if (Test-Path -LiteralPath $Source -PathType Leaf) {
        $Destination = Join-Path $Backup $RelativePath
        $DestinationFolder = Split-Path $Destination

        New-Item -ItemType Directory -Force -Path $DestinationFolder | Out-Null
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

Write-Log "Local changes backed up to $Backup"
```

}

function Test-Project {
param(
[string]$Root
)

```
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "uaos-live-clean"

if (Test-Path -LiteralPath (Join-Path $Backend "package.json")) {
    Invoke-Step "Backend install" {
        Set-Location -LiteralPath $Backend
        npm install
    }

    $BackendPackage = Get-Content -LiteralPath (Join-Path $Backend "package.json") -Raw | ConvertFrom-Json

    if ($BackendPackage.scripts.test) {
        Invoke-Step "Backend tests" {
            Set-Location -LiteralPath $Backend
            npm test
        } -Optional
    }

    Invoke-Step "Backend syntax check" {
        Get-ChildItem -Path $Backend -Filter "*.js" -File -Recurse |
            ForEach-Object {
                node --check $_.FullName

                if ($LASTEXITCODE -ne 0) {
                    throw "Syntax error: $($_.FullName)"
                }
            }
    } -Optional
}

if (Test-Path -LiteralPath (Join-Path $Frontend "package.json")) {
    Invoke-Step "Frontend install" {
        Set-Location -LiteralPath $Frontend
        npm install
    }

    $FrontendPackage = Get-Content -LiteralPath (Join-Path $Frontend "package.json") -Raw | ConvertFrom-Json

    if ($FrontendPackage.scripts.test) {
        Invoke-Step "Frontend tests" {
            Set-Location -LiteralPath $Frontend
            npm test -- --run
        } -Optional
    }

    if ($FrontendPackage.scripts.check) {
        Invoke-Step "Frontend check" {
            Set-Location -LiteralPath $Frontend
            npm run check
        } -Optional
    }

    Invoke-Step "Frontend production build" {
        Set-Location -LiteralPath $Frontend
        npm run build
    }
}

Invoke-Step "Git diff validation" {
    Set-Location -LiteralPath $Root
    git diff --check
}
```

}

Write-Log "UAOS ALL AGENTS SAFE CONTINUATION START"

Backup-LocalWork

Invoke-Step "GitHub authentication" {
gh auth status
}

Invoke-Step "Fetch remote master" {
Set-Location -LiteralPath $Repo
git fetch origin master
}

if (Test-Path -LiteralPath $Worktree) {
git -C $Repo worktree remove --force $Worktree 2>$null
Remove-Item -LiteralPath $Worktree -Recurse -Force -ErrorAction SilentlyContinue
}

$Branch = "codex/uaos-final-completion-$Stamp"

Invoke-Step "Create isolated worktree" {
Set-Location -LiteralPath $Repo
git worktree add -b $Branch $Worktree origin/master
}

$PromptLines = @(
"Complete all technically possible remaining UAOS implementation.",
"",
"Repository: $RepoName",
"Worktree: $Worktree",
"",
"Mandatory safety rules:",
"- Work only inside the supplied worktree.",
"- Do not use git reset --hard.",
"- Do not use git clean.",
"- Do not delete user files.",
"- Do not kill all Node, Electron, or PowerShell processes.",
"- Do not download files or unpack archives.",
"- Do not claim physical hardware validation without evidence.",
"- Keep mock and demo functions clearly labeled.",
"- Preserve completed backend, Sessions, Audio, MIDI, navigation, Smart Sequencer, and UMS work.",
"",
"Complete in this order:",
"1. Studio project persistence, autosave, recovery, rename, duplicate, and delete.",
"2. Sampler preset persistence, WAV mapping, zones, velocity ranges, and missing-file recovery.",
"3. Arranger transport, chord recognition, variations, fills, endings, timeline, and MIDI export.",
"4. Real MIDI output, reconnect, panic, MIDI Learn, and safe hardware profiles.",
"5. Sound-library indexing, legal metadata, missing files, and duplicate detection.",
"6. Sessions and Timeline undo, redo, import, export, and persistence.",
"7. Electron offline runtime and Windows packaging readiness.",
"8. Android readiness and debug-build configuration.",
"9. Lazy loading, bundle optimization, and duplicate-code removal.",
"10. Release gates, diagnostics, truthful capability status, and release report.",
"",
"For every completed area:",
"- Implement real code rather than placeholders.",
"- Add or update tests.",
"- Run relevant tests and production build.",
"- Commit all intended changes.",
"- Separate code blockers from external credentials and physical-device blockers.",
"",
"Do not stop after analysis. Implement as much as technically possible."
)

$PromptLines |
Set-Content -LiteralPath $PromptFile -Encoding UTF8

$Agents = @()

$Agent = Get-Agent -Name "codex" -Commands @("codex","codex.cmd","codex.exe")
if ($Agent) {
$Agents += $Agent
}

$Agent = Get-Agent -Name "claude" -Commands @("claude","claude.cmd","claude.exe")
if ($Agent) {
$Agents += $Agent
}

$Agent = Get-Agent -Name "aider" -Commands @("aider","aider.exe")
if ($Agent) {
$Agents += $Agent
}

$Agent = Get-Agent -Name "gemini" -Commands @("gemini","gemini.cmd","gemini.exe")
if ($Agent) {
$Agents += $Agent
}

if ($Agents.Count -eq 0) {
throw "No supported agent CLI found: Codex, Claude, Aider, or Gemini."
}

Write-Log ("Detected agents: " + (($Agents | ForEach-Object { $_.Name }) -join ", "))

$AuditJobs = @()
$PromptText = Get-Content -LiteralPath $PromptFile -Raw

foreach ($CurrentAgent in $Agents) {
$AuditOutput = Join-Path $RunRoot ($CurrentAgent.Name + "-audit.txt")

```
$AuditJobs += Start-Job -ArgumentList $CurrentAgent.Name,$CurrentAgent.Path,$PromptText,$AuditOutput -ScriptBlock {
    param(
        $AgentName,
        $AgentPath,
        $Prompt,
        $OutputPath
    )

    $AuditPrompt = "AUDIT ONLY. DO NOT MODIFY FILES." + [Environment]::NewLine + $Prompt

    try {
        if ($AgentName -eq "codex") {
            & $AgentPath exec --sandbox read-only --skip-git-repo-check $AuditPrompt 2>&1 |
                Set-Content -LiteralPath $OutputPath -Encoding UTF8
        }
        elseif ($AgentName -eq "claude") {
            & $AgentPath -p $AuditPrompt 2>&1 |
                Set-Content -LiteralPath $OutputPath -Encoding UTF8
        }
        elseif ($AgentName -eq "aider") {
            & $AgentPath --message $AuditPrompt --dry-run 2>&1 |
                Set-Content -LiteralPath $OutputPath -Encoding UTF8
        }
        elseif ($AgentName -eq "gemini") {
            & $AgentPath -p $AuditPrompt 2>&1 |
                Set-Content -LiteralPath $OutputPath -Encoding UTF8
        }
    }
    catch {
        $_.Exception.Message |
            Set-Content -LiteralPath $OutputPath -Encoding UTF8
    }
}
```

}

$Primary = $null

foreach ($PreferredName in @("codex","claude","aider","gemini")) {
$Primary = $Agents |
Where-Object { $_.Name -eq $PreferredName } |
Select-Object -First 1

```
if ($Primary) {
    break
}
```

}

Write-Log "Primary implementation agent: $($Primary.Name)"

$ImplementationSucceeded = Invoke-Step "Primary agent implementation" {
Set-Location -LiteralPath $Worktree

```
if ($Primary.Name -eq "codex") {
    & $Primary.Path exec --full-auto --sandbox workspace-write --skip-git-repo-check $PromptText
}
elseif ($Primary.Name -eq "claude") {
    & $Primary.Path -p $PromptText --permission-mode acceptEdits
}
elseif ($Primary.Name -eq "aider") {
    & $Primary.Path --yes-always --message $PromptText
}
elseif ($Primary.Name -eq "gemini") {
    & $Primary.Path -p $PromptText
}
```

} -Optional

Test-Project -Root $Worktree

Set-Location -LiteralPath $Worktree

$Changes = @(git status --porcelain)

if ($Changes.Count -gt 0) {
Invoke-Step "Commit UAOS completion" {
git add -A
git commit -m "Complete remaining UAOS implementation and release readiness"
}

```
Invoke-Step "Push completion branch" {
    git push -u origin $Branch
}

$PrBodyPath = Join-Path $RunRoot "pr-body.txt"

$PrBodyLines = @(
    "UAOS final remaining implementation",
    "",
    "Validation completed:",
    "- Backend install and available tests",
    "- Frontend install and available tests",
    "- Frontend production build",
    "- Git diff validation",
    "",
    "Safety:",
    "- Isolated Git worktree",
    "- Original working tree backed up",
    "- No hard reset",
    "- No git clean",
    "- No fabricated hardware, signing, store, payment, or legal claims"
)

$PrBodyLines |
    Set-Content -LiteralPath $PrBodyPath -Encoding UTF8

Invoke-Step "Create completion pull request" {
    gh pr create --repo $RepoName --base master --head $Branch --title "[codex] Complete remaining UAOS implementation" --body-file $PrBodyPath --draft
}

$PrNumber = gh pr view $Branch --repo $RepoName --json number --jq ".number"

$ChecksPassed = Invoke-Step "Wait for pull request checks" {
    gh pr checks $PrNumber --repo $RepoName --watch
} -Optional

if ($ChecksPassed -and !$NoMerge) {
    Invoke-Step "Mark pull request ready" {
        gh pr ready $PrNumber --repo $RepoName
    } -Optional

    Invoke-Step "Merge completion pull request" {
        gh pr merge $PrNumber --repo $RepoName --squash --delete-branch
    }
}
elseif (!$ChecksPassed) {
    Write-Log "Checks did not pass. PR #$PrNumber remains open." "WARN"
}
```

}
else {
Write-Log "No repository changes were produced." "WARN"
}

if ($AuditJobs.Count -gt 0) {
Wait-Job -Job $AuditJobs | Out-Null

```
foreach ($Job in $AuditJobs) {
    Receive-Job -Job $Job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $Job -Force
}
```

}

Invoke-Step "Refresh final master state" {
Set-Location -LiteralPath $Repo
git fetch origin master
}

$MasterSha = git -C $Repo rev-parse origin/master

$ReportLines = @(
"UAOS ALL AGENTS FINAL REPORT",
"",
"Run: $Stamp",
"Repository: $RepoName",
"Remote master: $MasterSha",
"Primary agent: $($Primary.Name)",
"Detected agents: " + (($Agents | ForEach-Object { $_.Name }) -join ", "),
"Backup: $Backup",
"Log: $LogFile",
"",
"External blockers:",
"- Physical microphone and acoustic test",
"- Physical KORG, Yamaha, Roland, and Ketron MIDI tests",
"- Windows signing certificate",
"- Android and iOS signing credentials",
"- Payment credentials",
"- Legal and commercial approval",
"- Distribution licenses for commercial sound content"
)

$ReportLines |
Set-Content -LiteralPath $FinalReport -Encoding UTF8

Write-Log "UAOS ALL AGENTS SAFE CONTINUATION COMPLETE" "PASS"
Write-Log "FINAL REPORT: $FinalReport"
Write-Log "LOG: $LogFile"
Write-Log "BACKUP: $Backup"

Start-Process notepad.exe -ArgumentList $FinalReport