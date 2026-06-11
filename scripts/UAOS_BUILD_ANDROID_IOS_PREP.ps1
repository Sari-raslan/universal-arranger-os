$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Report="agent-output\UAOS_MOBILE_APK_IOS_REPORT.md"
"# UAOS Mobile APK/iOS Build Report`nGenerated: $(Get-Date)`n" | Set-Content $Report -Encoding UTF8
function Log($m){ $m | Tee-Object -FilePath $Report -Append }

Log "## 1. Build web app"
npm run build --prefix uaos-live-clean 2>&1 | Tee-Object -FilePath $Report -Append

Log "## 2. Install Capacitor mobile deps"
Push-Location mobile
npm install 2>&1 | Tee-Object -FilePath "..\$Report" -Append

Log "## 3. Init Capacitor if needed"
if(!(Test-Path "capacitor.config.json")){
  npm run init 2>&1 | Tee-Object -FilePath "..\$Report" -Append
}

Log "## 4. Add Android platform"
if(!(Test-Path "android")){
  npm run add-android 2>&1 | Tee-Object -FilePath "..\$Report" -Append
}else{
  Log "Android folder already exists."
}

Log "## 5. Sync Android/iOS config"
npm run sync 2>&1 | Tee-Object -FilePath "..\$Report" -Append

Log "## 6. Build Android debug APK"
if(Test-Path "android\gradlew.bat"){
  Push-Location android
  .\gradlew.bat assembleDebug 2>&1 | Tee-Object -FilePath "..\..\$Report" -Append
  Pop-Location
}else{
  Log "gradlew.bat not found. Open Android Studio once from npm run android."
}

Log "## 7. iOS note"
Log "iOS cannot be built on Windows. This project is prepared. Copy repo to Mac, then run:"
Log "cd mobile"
Log "npm install"
Log "npm run add-ios"
Log "npm run sync"
Log "npm run ios"

Pop-Location

Log "## 8. Output paths"
Log "Android debug APK should be here:"
Log "mobile\android\app\build\outputs\apk\debug\app-debug.apk"

@"
# UAOS Mobile Final Commands

## Android APK on Windows
cd "$Root\mobile"
npm install
npm run build-web
npm run add-android
npm run sync
cd android
.\gradlew.bat assembleDebug

APK path:
$Root\mobile\android\app\build\outputs\apk\debug\app-debug.apk

## Open Android Studio
cd "$Root\mobile"
npm run android

## iPhone / iOS
iOS requires macOS + Xcode + Apple Developer account.

On Mac:
cd mobile
npm install
npm run build-web
npm run add-ios
npm run sync
npm run ios

Then in Xcode:
- Select Team
- Set Bundle ID: app.aeplatform.uaos
- Build to iPhone
- Archive for App Store/TestFlight
"@ | Set-Content "release-kit\UAOS_MOBILE_APK_IOS_COMMANDS.md" -Encoding UTF8

notepad $Report
notepad "release-kit\UAOS_MOBILE_APK_IOS_COMMANDS.md"
