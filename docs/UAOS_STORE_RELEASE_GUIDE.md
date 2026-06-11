# UAOS Store Release Guide

## Desktop

Windows desktop package is prepared with Electron.

Commands:
cd desktop
npm install
npm run pack

## Android APK / Google Play

Required:

* Android Studio
* Java JDK
* Google Play Developer account

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

* macOS
* Xcode
* Apple Developer account

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

