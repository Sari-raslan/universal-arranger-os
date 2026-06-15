# =========================================================================
# UAOS MASTER REMAINING ALL-IN-ONE LAUNCHER
# Automated Verification, Cleaning, Dependency Management, and Builds
# =========================================================================

$ErrorActionPreference = "Continue"

$AppRoot = $PSScriptRoot
if ($AppRoot.EndsWith("scripts")) {
    $AppRoot = Split-Path $AppRoot -Parent
}

$LogDir = Join-Path $AppRoot "reports\master-launcher"
$LogFile = Join-Path $LogDir "run.log"
$MdReport = Join-Path $LogDir "report.md"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# تهيئة التقارير
"=== UAOS RUN LOG $(Get-Date) ===" | Out-File $LogFile -Encoding UTF8

@"
# UAOS Master Remaining Verification Report
**Date**: $(Get-Date)
**Repository Root**: $AppRoot

---
"@ | Out-File $MdReport -Encoding UTF8

function Log($msg, $type="INFO") {
    $t = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "$t | [$type] | $msg"
    Write-Host $line
    $line | Out-File $LogFile -Append -Encoding UTF8
}

function Log-Report($msg) {
    $msg | Out-File $MdReport -Append -Encoding UTF8
}

Log "Starting UAOS Master remaining run..."

# [1] التحقق من سلامة البنية والملفات الرئيسية
Log "Verifying structure and core files..."
$StructureChecks = @(
    @{ Path = "package.json"; Req = $true },
    @{ Path = "backend/server.js"; Req = $true },
    @{ Path = "uaos-live-clean/package.json"; Req = $true },
    @{ Path = "scripts"; Req = $true }
)

Log-Report "## 1. Structure Verification"
foreach ($chk in $StructureChecks) {
    $fullPath = Join-Path $AppRoot $chk.Path
    if (Test-Path $fullPath) {
        Log "[OK] Found structure item: $($chk.Path)"
        Log-Report "- [x] Found: \'$($chk.Path)\'"
    } else {
        if ($chk.Req) {
            Log "[FAIL] Missing required structure item: $($chk.Path)" "ERROR"
            Log-Report "- [ ] **MISSING**: \'$($chk.Path)\' (Required)"
        } else {
            Log "[WARN] Missing optional structure item: $($chk.Path)" "WARN"
            Log-Report "- [ ] *MISSING*: \'$($chk.Path)\' (Optional)"
        }
    }
}

# [2] التحقق من الأدوات المساعدة للنظام
Log "Verifying toolchains..."
Log-Report "'n## 2. System Toolchain Check"
$Tools = @("node", "npm", "git")
foreach ($t in $Tools) {
    if (Get-Command $t -ErrorAction SilentlyContinue) {
        $ver = ""
        if ($t -eq "node") { $ver = node -v }
        elseif ($t -eq "npm") { $ver = npm -v }
        elseif ($t -eq "git") { $ver = (git --version).Trim() }
        Log "[OK] $t is available ($ver)"
        Log-Report "- [x] **$t** is installed ($ver)"
    } else {
        Log "[FAIL] $t is not found in system PATH" "ERROR"
        Log-Report "- [ ] **$t** is *MISSING* in PATH"
    }
}

# [3] عرض حالة الـ Git الحالية دون تعديل
Log "Capturing Git Status..."
Log-Report "'n## 3. Git Status Capture"
$gitStatus = git status -sb 2>&1 | Out-String
Log-Report "\'\'\'text'n$gitStatus\'\'\'"

# [4] التنظيف الآمن للملفات المؤقتة والكاش
Log "Performing safe cache and log cleaning..."
Log-Report "'n## 4. Safe Cleaning Actions"
$CleanPaths = @(
    ".npm-cache",
    "uaos-live-clean/dist",
    "reports/uaos-preview.pid",
    "reports/runtime-monitor.log"
)

foreach ($cp in $CleanPaths) {
    $target = Join-Path $AppRoot $cp
    if (Test-Path $target) {
        Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue
        Log "Cleaned: $cp"
        Log-Report "- Cleaned: \'$cp\'"
    }
}

# مسح ملفات *.tmp و *.bak بشكل آمن وعودي
$tmpCount = 0
$bakCount = 0
Get-ChildItem -Path $AppRoot -Filter *.tmp -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    $tmpCount++
}
Get-ChildItem -Path $AppRoot -Filter *.bak -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    $bakCount++
}
Log "Cleaned $tmpCount temporary files (.tmp)"
Log "Cleaned $bakCount backup files (.bak)"
Log-Report "- Cleaned $tmpCount \'*.tmp\' files recursively."
Log-Report "- Cleaned $bakCount \'*.bak\' files recursively."

# [5] تثبيت الاعتماديات (Dependencies) بشكل آمن ومنظم
Log-Report "'n## 5. Dependency Installations"
function Install-Deps($dir, $name) {
    if (Test-Path $dir) {
        Push-Location $dir
        Log "Installing dependencies for $name..."
        
        $hasLock = Test-Path "package-lock.json"
        if ($hasLock) {
            Log "package-lock.json found. Running npm ci..."
            npm ci 2>&1 | Out-File $LogFile -Append -Encoding UTF8
        } else {
            Log "package-lock.json not found. Running npm install..."
            npm install 2>&1 | Out-File $LogFile -Append -Encoding UTF8
        }
        
        if ($LASTEXITCODE -eq 0) {
            Log "[OK] Installed dependencies for $name"
            Log-Report "- [x] Installed dependencies for **$name** successfully."
        } else {
            Log "[WARN] Non-zero exit code during install for $name" "WARN"
            Log-Report "- [ ] *WARN*: Dependencies for **$name** exited with non-zero status code."
        }
        Pop-Location
    } else {
        Log "Directory $dir not found, skipping dependency installation." "WARN"
    }
}

Install-Deps $AppRoot "Root Project"
Install-Deps (Join-Path $AppRoot "backend") "Backend Module"
Install-Deps (Join-Path $AppRoot "uaos-live-clean") "UAOS Live Clean Module"

# [6] تشغيل اختبار الفحص الثابت (Linting / Formatting Checks)
Log-Report "'n## 6. Static Analysis Checks"
Log "Running 'npm run check'..."
Push-Location $AppRoot
$checkResult = npm run check 2>&1 | Out-String
$checkExit = $LASTEXITCODE
Pop-Location

Log "Check Exit Code: $checkExit"
Log-Report "Exit Code: \'$checkExit\'"
Log-Report "\'\'\'text'n$checkResult\'\'\'"

# [7] بناء المشروع (Production Build)
Log-Report "'n## 7. Build Orchestration"
Log "Running 'npm run build'..."
Push-Location $AppRoot
$buildResult = npm run build 2>&1 | Out-String
$buildExit = $LASTEXITCODE
Pop-Location

Log "Build Exit Code: $buildExit"
Log-Report "Exit Code: \'$buildExit\'"
Log-Report "\'\'\'text'n$buildResult\'\'\'"

# [8] التحقق من ناتج البناء (Build Outputs Verification)
Log-Report "'n## 8. Build Deliverable Validation"
$liveHtml = Join-Path $AppRoot "uaos-live-clean/dist/index.html"
if (Test-Path $liveHtml) {
    Log "[OK] Found generated artifact: uaos-live-clean/dist/index.html"
    Log-Report "- [x] **Validated**: \'uaos-live-clean/dist/index.html\' exists and is compiled."
} else {
    Log "[FAIL] Build artifact missing: uaos-live-clean/dist/index.html" "ERROR"
    Log-Report "- [ ] **FAILED**: \'uaos-live-clean/dist/index.html\' was NOT generated."
}

# [9] تشغيل اختبارات الدخان (Smoke & Runtime Checks) بشكل اختياري وآمن
Log-Report "'n## 9. Smoke & Runtime Verification"

Log "Running optional desktop smoke test..."
Push-Location $AppRoot
try {
    $smoke = npm run desktop:smoke 2>&1 | Out-String
    Log "[OK] Smoke check executed (Optional)"
    Log-Report "### Desktop Smoke Check (Optional)'n\'\'\'text'n$smoke\'\'\'"
} catch {
    Log "[WARN] Desktop smoke script not found or failed." "WARN"
    Log-Report "### Desktop Smoke Check'n*Optional script omitted or failed to execute.*"
}
Pop-Location

Log "Running optional runtime verification..."
Push-Location $AppRoot
try {
    $runtime = npm run runtime:check 2>&1 | Out-String
    Log "[OK] Runtime check executed (Optional)"
    Log-Report "### Runtime Check (Optional)'n\'\'\'text'n$runtime\'\'\'"
} catch {
    Log "[WARN] Runtime check script not found or failed." "WARN"
    Log-Report "### Runtime Check'n*Optional script omitted or failed to execute.*"
}
Pop-Location

# [10] فحص ملفات .env.example للتأكد من خلوها من الأسرار الحقيقية
Log-Report "'n## 10. Secrets & Environment Audit"
Log "Scanning environment example configurations..."
$envExamples = Get-ChildItem -Path $AppRoot -Recurse -Filter .env.example -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($envf in $envExamples) {
    $content = Get-Content $envf.FullName -Raw
    # التحقق من أنماط مفاتيح Stripe live الحقيقية أو كلمات مرور واضحة
    if ($content -match "sk_live_" -or $content -match "pk_live_" -or $content -match "secret_key=(?!your_|[a-zA-Z0-9_\-]*dummy)[a-zA-Z0-9_]{16,}") {
        Log "[WARN] Sensitive production key format pattern found in $($envf.FullName)" "WARN"
        Log-Report "- [ ] *WARNING*: Potential active key pattern found in \'$($envf.FullName)\'"
    } else {
        Log "[OK] Configuration template is clean and safe: $($envf.FullName)"
        Log-Report "- [x] Safe configuration template: \'$($envf.FullName)\'"
    }
}

# الملخص النهائي
Log "UAOS Master remaining check finished."
Log-Report "'n## 11. Run Summary"
if ($buildExit -eq 0 -and (Test-Path $liveHtml)) {
    Log-Report "### **STATUS: PASS** 🚀"
} else {
    Log-Report "### **STATUS: FAIL** ⚠️"
}

Log "Report written to: $MdReport"
