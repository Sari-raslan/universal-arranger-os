@echo off
setlocal
cd /d "%~dp0"
title Stop UAOS MIDI Toolkit
if not exist "DATA\runtime.pid.json" (
  echo No running session recorded. Nothing to stop.
  pause
  exit /b 0
)
echo Stopping UAOS MIDI Toolkit...
"RUNTIME\node\node.exe" -e "const fs=require('fs');const p='DATA/runtime.pid.json';try{const j=JSON.parse(fs.readFileSync(p,'utf8'));try{process.kill(j.pid)}catch(e){};fs.unlinkSync(p);console.log('Stopped.');}catch(e){console.log('Already stopped.');}"
pause
