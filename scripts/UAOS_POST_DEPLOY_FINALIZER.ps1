$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Live="https://universal-arranger-os.vercel.app"
Set-Location $Root
New-Item -ItemType Directory -Force scripts,reports,release-kit,agent-output | Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="reports\UAOS_POST_DEPLOY_FINALIZER_$Stamp.txt"
function L($m){ $m | Tee-Object -FilePath $Log -Append }
L "UAOS POST DEPLOY FINALIZER"
L "Time: $(Get-Date)"
L "Live: $Live"
$GitIgnore="node_modules/`ndist/`nbuild/`n.vite/`n.vercel/`n.gradle/`nagent-output/*.log`nreports/*.txt`n*.apk`n*.aab`n*.ipa`n*.exe`n*.msi`n*.zip`n*.7z"
$GitIgnore | Set-Content ".gitignore" -Encoding UTF8
$RunLocal = @("$Root=`"$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"","Set-Location `"$Root\uaos-live-clean`"","npm run dev -- --host 127.0.0.1 --port 5173")
$RunLocal | Set-Content "scripts\UAOS_RUN_LOCAL_V1.ps1" -Encoding UTF8
$BuildVerify = @("$Root=`"$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"","Set-Location $Root","npm install --prefix uaos-live-clean","npm run build --prefix uaos-live-clean","git status")
$BuildVerify | Set-Content "scripts\UAOS_BUILD_VERIFY_V1.ps1" -Encoding UTF8
$Deploy = @("$Root=`"$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"","Set-Location `"$Root\uaos-live-clean`"","npm install","npm run build","vercel --prod --yes")
$Deploy | Set-Content "scripts\UAOS_DEPLOY_PUBLIC_V1.ps1" -Encoding UTF8
L "=== BUILD VERIFY ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){ L "Build failed. Stop."; notepad $Log; exit }
L "=== PUBLIC ROUTE CHECKS ==="
$Routes=@("/","/#/sing","/#/studio","/#/pro","/#/midi","/#/sounds","/#/sampler","/#/promo","/#/pricing","/#/downloads")
foreach($r in $Routes){
  $u="$Live$r"
  try{ $res=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 20; L "$u => $($res.StatusCode)" }
  catch{ L "$u => FAIL $($_.Exception.Message)" }
}
$Links="# UAOS PUBLIC V1.2 LINKS`n`nLive:`n$Live`n`nRoutes:`n$Live`n$Live/#/sing`n$Live/#/studio`n$Live/#/pro`n$Live/#/midi`n$Live/#/sounds`n$Live/#/sampler`n$Live/#/promo`n$Live/#/pricing`n$Live/#/downloads"
$Links | Set-Content "release-kit\UAOS_PUBLIC_V12_LINKS.md" -Encoding UTF8
$Status="# UAOS PUBLIC V1.2 STATUS`n`nStatus: DEPLOYED`n`nLive: $Live`n`nCompleted:`n- Web platform`n- Sing`n- Studio`n- Pro Arranger`n- MIDI diagnostics`n- Sounds`n- Sampler`n- Promotion`n- Pricing`n- Downloads`n`nNext:`n- React Router`n- Electron desktop`n- WebMIDI bridge`n- Voice analysis`n- Audio engine`n- APK"
$Status | Set-Content "release-kit\UAOS_PUBLIC_V12_STATUS.md" -Encoding UTF8
L "=== GIT SAFE COMMIT ==="
git add .gitignore
git add scripts\UAOS_RUN_LOCAL_V1.ps1
git add scripts\UAOS_BUILD_VERIFY_V1.ps1
git add scripts\UAOS_DEPLOY_PUBLIC_V1.ps1
git add scripts\UAOS_POST_DEPLOY_FINALIZER.ps1
git add release-kit\UAOS_PUBLIC_V12_LINKS.md
git add release-kit\UAOS_PUBLIC_V12_STATUS.md
git commit -m "Finalize UAOS public V1.2 deployment kit" 2>&1 | Tee-Object -FilePath $Log -Append
L "=== PUSH ATTEMPT ==="
git push origin master 2>&1 | Tee-Object -FilePath $Log -Append
L "=== FINAL STATUS ==="
git status | Tee-Object -FilePath $Log -Append
L "DONE. Live URL: $Live"
notepad $Log
