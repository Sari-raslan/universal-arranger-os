$ErrorActionPreference="Continue"
$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

function Log($m){
  $l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $l -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_FINAL_PRODUCT_RELEASE_$Stamp.log" $l
}

function W($p,$t){
  $full=Join-Path $Repo $p
  $dir=Split-Path $full -Parent
  if(!(Test-Path $dir)){New-Item -ItemType Directory -Force $dir | Out-Null}
  Set-Content $full $t -Encoding UTF8
}

Log "UAOS FINAL PRODUCT RELEASE START"

W "uaos-live-clean\public\manifest.json" '{
  "name":"UAOS HyperStation",
  "short_name":"UAOS",
  "start_url":"/",
  "display":"standalone",
  "background_color":"#050816",
  "theme_color":"#111827",
  "icons":[
    {"src":"/icon-192.png","sizes":"192x192","type":"image/png"},
    {"src":"/icon-512.png","sizes":"512x512","type":"image/png"}
  ]
}'

W "uaos-live-clean\public\service-worker.js" 'self.addEventListener("install",e=>self.skipWaiting());self.addEventListener("activate",e=>self.clients.claim());'

W "uaos-live-clean\index.html" '<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><link rel="manifest" href="/manifest.json"/><title>UAOS HyperStation</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'

W "desktop\package.json" '{
  "name":"uaos-hyperstation-desktop",
  "version":"1.0.0",
  "main":"src/main.js",
  "scripts":{
    "start":"electron src/main.js",
    "pack":"electron-builder --win portable",
    "dist":"electron-builder"
  },
  "devDependencies":{
    "electron":"latest",
    "electron-builder":"latest"
  },
  "build":{
    "appId":"app.aeplatform.uaos",
    "productName":"UAOS HyperStation",
    "directories":{"output":"dist"},
    "files":["src/**/*"],
    "win":{"target":["portable","nsis"]}
  }
}'

W "desktop\src\main.js" 'const {app,BrowserWindow}=require("electron");function create(){const win=new BrowserWindow({width:1500,height:950,backgroundColor:"#050816",webPreferences:{nodeIntegration:false,contextIsolation:true}});win.loadURL("http://127.0.0.1:5199");}app.whenReady().then(create);app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});'

W "mobile\package.json" '{
  "name":"uaos-mobile",
  "version":"1.0.0",
  "type":"module",
  "scripts":{
    "init":"capacitor init UAOS app.aeplatform.uaos --web-dir ../uaos-live-clean/dist",
    "android":"capacitor add android",
    "ios":"capacitor add ios",
    "sync":"capacitor sync",
    "open-android":"capacitor open android",
    "open-ios":"capacitor open ios"
  },
  "dependencies":{
    "@capacitor/core":"latest",
    "@capacitor/cli":"latest",
    "@capacitor/android":"latest",
    "@capacitor/ios":"latest"
  }
}'

W "docs\UAOS_STORE_RELEASE_GUIDE.md" '# UAOS Store Release Guide

## Desktop
Windows desktop package is prepared with Electron.

Commands:
cd desktop
npm install
npm run pack

## Android APK / Google Play
Required:
- Android Studio
- Java JDK
- Google Play Developer account

Commands:
cd mobile
npm install
npm run init
npm run android
npm run sync
npm run open-android

Then build APK/AAB from Android Studio.

## iOS / Apple Store
Required:
- macOS
- Xcode
- Apple Developer account

Commands on Mac:
cd mobile
npm install
npm run init
npm run ios
npm run sync
npm run open-ios

Then archive/upload from Xcode.

## PWA
The web app is now installable as a PWA from browser.
'

W "agent-output\UAOS_TODAY_LAUNCH_STATUS.md" 'UAOS TODAY LAUNCH STATUS

READY:
- Web App UI
- Paid Landing Page
- Vercel Deployment
- GitHub Push
- Domain DNS nearly ready
- PWA setup
- Desktop Electron setup
- Android/iOS Capacitor preparation
- Store release guide

MANUAL STILL REQUIRED:
- Real payment links
- Google Play developer upload
- Apple Developer / Xcode build
- Final domain verification refresh
'

Log "BUILD APP"
npm run build --prefix uaos-live-clean

Log "BUILD SALES"
npm run build --prefix landing-sales

Log "INSTALL DESKTOP"
npm install --prefix desktop

Log "INSTALL MOBILE"
npm install --prefix mobile

Log "GIT SAVE"
git add .
git commit -m "Prepare UAOS final web desktop mobile release kit"
git push origin master

Log "START LOCAL APP"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5199 --force"
Start-Sleep 5
Start-Process "http://127.0.0.1:5199"

Log "DONE"
notepad "$Repo\agent-output\UAOS_TODAY_LAUNCH_STATUS.md"
notepad "$Repo\docs\UAOS_STORE_RELEASE_GUIDE.md"
