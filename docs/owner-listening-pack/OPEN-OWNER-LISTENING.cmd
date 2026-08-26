@echo off
cd /d C:\keyboard-manager-clean
echo Opening UAOS Owner Listening UI on http://127.0.0.1:8765/
echo Playback is not PASS. WAV files are not modified.
node scripts\start-owner-listening-ui.mjs
