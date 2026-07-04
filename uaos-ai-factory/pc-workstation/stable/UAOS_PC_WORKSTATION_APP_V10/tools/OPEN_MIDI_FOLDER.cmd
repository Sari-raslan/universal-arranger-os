@echo off
echo Opening local MIDI folder only.
if exist "%~dp0..\midi" (
  start "" "%~dp0..\midi"
) else (
  start "" "%~dp0..\writer\generated_v17_outputs"
)
