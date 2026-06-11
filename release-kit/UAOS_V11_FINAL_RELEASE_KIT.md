# UAOS V11 Final Release Kit

## Local Run
powershell -ExecutionPolicy Bypass -File ".\scripts\UAOS_MASTER_REMAINING_ALL_IN_ONE.ps1"

## Deploy
vercel --prod --yes

## Desktop
cd desktop
npm install
npm run pack

## Android
cd mobile
npm install
npm run init
npm run android
npm run sync

## iOS
Requires macOS + Xcode.

## Still Pending
- Real Stripe/LemonSqueezy links
- Vercel domain verification refresh/TXT
- Real original/licensed WAV recordings
- Real Electron pack after adding electron-builder
- Real APK after Capacitor setup
