$ErrorActionPreference = 'Continue'

$Repo = 'C:\Users\ssare\keyboard-manager-clean'
$Jdk = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'

$env:JAVA_HOME = $Jdk
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$Jdk\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

cd "$Repo"

npm install
cd frontend
npm install
npm run build
cd ..

npm install @capacitor/cli @capacitor/core @capacitor/android
npx cap sync android

cd android
.\gradlew.bat assembleDebug
cd ..

Write-Host 'Android debug build attempted.'
