$Root = "C:\Users\ssare\keyboard-manager-clean"
$Frontend = "$Root\frontend"
$Live = "https://sari-raslan.github.io/universal-arranger-os"
$Log = "$Root\reports\UAOS_SAFE_RECOVER_BUILD_PUBLISH.log"

function L($m){
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" | Tee-Object -FilePath $Log -Append
}

Set-Location $Root
L "START"

# 1. أوقف أي rebase/merge عالق
git merge --abort 2>$null
git rebase --abort 2>$null

# 2. رجوع آمن لآخر نسخة remote
git fetch origin
git reset --hard origin/master

# 3. تأكد أن الواجهة تبني
Set-Location $Frontend
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
  L "BUILD FAILED"
  exit 1
}

# 4. نشر GitHub Pages من dist
Set-Location $Root
Remove-Item docs -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Frontend\dist" docs -Recurse -Force
New-Item docs\.nojekyll -ItemType File -Force | Out-Null
Copy-Item docs\index.html docs\404.html -Force

# 5. تقرير
@"
# UAOS Safe Recover Build Publish

Time:
$(Get-Date)

Status:
Build PASS
GitHub Pages files refreshed

Live:
$Live
"@ | Out-File reports\UAOS_SAFE_RECOVER_BUILD_PUBLISH.md -Encoding utf8

# 6. Commit + push
git add docs reports\UAOS_SAFE_RECOVER_BUILD_PUBLISH.md
git commit -m "Safe recover build and publish UAOS" 2>$null
git push

# 7. فتح الموقع
Start-Process "$Live/?v=$(Get-Date -Format yyyyMMddHHmmss)"

L "DONE"
